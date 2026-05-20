// =========================================================
// edit.jsx — Hyperion operator card editor (PAT-gated)
//
// Mounts the same <App> the public card uses, but wraps it with
// a <TweaksPanel> that exposes every editable field from
// card.config.json. A floating Save button commits the pending
// edits straight to GitHub via the Contents API using a
// fine-grained PAT held only in localStorage.
// =========================================================

const { useState: useStateE, useEffect: useEffectE, useRef: useRefE } = React;

// ── Constants ─────────────────────────────────────────────────────────────
const REPO_OWNER     = "Code-Xer0";
const REPO_NAME      = "hyperion-industries-publish";
const CONFIG_PATH    = "assets/card/card.config.json";
const SLOTS_PATH     = "assets/card/.image-slots.state.json";
const PORTRAIT_PATH  = "assets/card/portrait.webp";
const PAT_KEY        = "hypEditPAT";
const BRANCH_KEY     = "hypEditBranch";
const DEFAULT_BRANCH = "codex/ecosystem-navigation-staging";

// ── GitHub API helpers ────────────────────────────────────────────────────
const gh = {
  token:  () => localStorage.getItem(PAT_KEY) || "",
  branch: () => localStorage.getItem(BRANCH_KEY) || DEFAULT_BRANCH,
  setToken:  (t) => localStorage.setItem(PAT_KEY, t),
  setBranch: (b) => localStorage.setItem(BRANCH_KEY, b),
  clearToken: () => localStorage.removeItem(PAT_KEY),

  async whoami() {
    const r = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${gh.token()}`,
        Accept: "application/vnd.github+json",
      },
    });
    if (!r.ok) throw new Error(`auth: ${r.status}`);
    return r.json();
  },

  async getFile(path) {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${encodeURIComponent(gh.branch())}`;
    const r = await fetch(url, {
      headers: {
        Authorization: `Bearer ${gh.token()}`,
        Accept: "application/vnd.github+json",
      },
    });
    if (r.status === 404) return { sha: null, content: null };
    if (!r.ok) throw new Error(`get ${path}: ${r.status}`);
    const j = await r.json();
    // base64 content may include newlines; strip whitespace before atob.
    const b64 = (j.content || "").replace(/\s/g, "");
    const bytes = b64 ? Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)) : new Uint8Array();
    return { sha: j.sha, bytes, text: new TextDecoder("utf-8").decode(bytes) };
  },

  async putFile(path, contentBase64, message) {
    const cur = await gh.getFile(path);
    const body = {
      message,
      content: contentBase64,
      branch: gh.branch(),
    };
    if (cur.sha) body.sha = cur.sha;
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
    const r = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${gh.token()}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`put ${path}: ${r.status} ${await r.text()}`);
    return r.json();
  },
};

// utf-8 safe base64 — `unescape(encodeURIComponent(s))` would die on Δ etc.
function textToB64(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

// ── Editor store (window.__cardEditor) ────────────────────────────────────
// The TweaksPanel calls .queue(); image-slot calls .queueSlots(); the Save
// button drains both into GitHub commits.
window.__cardEditor = {
  pendingFlat: {},       // flat key → value edits from TweaksPanel
  pendingSlotsJson: null,// raw JSON string from image-slot's writeFile shim
  loadedConfig: null,
  configSha: null,

  queue(edits) {
    Object.assign(this.pendingFlat, edits);
  },

  queueSlots(jsonString) {
    this.pendingSlotsJson = jsonString;
  },

  hasChanges() {
    return Object.keys(this.pendingFlat).length > 0 || this.pendingSlotsJson != null;
  },

  // Merge a flat tweak namespace ({doctrineLabel, doctrineBody, ...}) back
  // into the nested config shape ({doctrine: {label, body, ...}, ...}).
  mergeFlat(base, flat) {
    const out = JSON.parse(JSON.stringify(base));
    out.doctrine = out.doctrine || {};
    out.links    = out.links    || {};
    for (const k in flat) {
      const v = flat[k];
      if (k.startsWith("doctrine") && k !== "doctrine") {
        const sub = k[8].toLowerCase() + k.slice(9); // doctrineLabel → label
        out.doctrine[sub] = v;
      } else if (k.startsWith("link_")) {
        out.links[k.slice(5)] = v;
      } else {
        out[k] = v;
      }
    }
    return out;
  },

  async save() {
    if (!this.hasChanges()) return { commits: [], note: "no changes" };
    const commits = [];

    if (Object.keys(this.pendingFlat).length > 0) {
      const merged = this.mergeFlat(this.loadedConfig || window.FALLBACK_CONFIG, this.pendingFlat);
      const json = JSON.stringify(merged, null, 2) + "\n";
      const res = await gh.putFile(CONFIG_PATH, textToB64(json),
        `editor: update card config (${Object.keys(this.pendingFlat).join(", ")})`);
      commits.push({ path: CONFIG_PATH, sha: res.commit.sha });
      this.loadedConfig = merged;
      this.configSha = res.content.sha;
      this.pendingFlat = {};
    }

    if (this.pendingSlotsJson != null) {
      const res = await gh.putFile(SLOTS_PATH, textToB64(this.pendingSlotsJson),
        "editor: update portrait crop / drop");
      commits.push({ path: SLOTS_PATH, sha: res.commit.sha });
      this.pendingSlotsJson = null;
    }

    return { commits };
  },
};

// ── image-slot bridge ─────────────────────────────────────────────────────
// image-slot writes via window.omelette.writeFile(path, content). We shim
// it to route slot state into the editor's pending buffer; Save flushes it.
window.omelette = window.omelette || {};
// image-slot writes its sidecar via its absolute STATE_FILE constant
// (/assets/card/.image-slots.state.json). Accept any path that ends with
// .image-slots.state.json so a future relocation doesn't break the bridge.
window.omelette.writeFile = (path, content) => {
  if (path.endsWith(".image-slots.state.json")) {
    window.__cardEditor.queueSlots(content);
    return Promise.resolve();
  }
  console.warn("omelette.writeFile: unsupported path", path);
  return Promise.resolve();
};

// ── Override the public config loader to also stash the SHA ───────────────
const originalLoad = window.__cardConfig.load;
window.__cardConfig = {
  load: async () => {
    try {
      // Prefer GitHub-API read so we get the current SHA at the same time
      // (avoids a separate API hit on Save and survives staging branches).
      if (gh.token()) {
        const file = await gh.getFile(CONFIG_PATH);
        if (file.text) {
          const cfg = JSON.parse(file.text);
          window.__cardEditor.loadedConfig = cfg;
          window.__cardEditor.configSha = file.sha;
          return cfg;
        }
      }
    } catch (e) {
      console.warn("editor config GET failed, falling back:", e);
    }
    // No PAT or fetch failed — use the plain HTTP loader.
    const cfg = await originalLoad();
    window.__cardEditor.loadedConfig = cfg;
    return cfg;
  },
};

// ── PAT gate modal ────────────────────────────────────────────────────────
const GATE_STYLE = `
  .hyp-gate-backdrop{position:fixed;inset:0;z-index:2147483647;
    background:rgba(5,4,6,0.92);backdrop-filter:blur(8px);display:grid;
    place-items:center;padding:24px}
  .hyp-gate{width:100%;max-width:420px;background:#0a0709;color:#f3efe6;
    border:1px solid rgba(255,42,54,0.35);border-radius:10px;padding:22px 24px;
    font:13px/1.55 "JetBrains Mono",ui-monospace,monospace;
    box-shadow:0 30px 80px -30px rgba(255,42,54,0.4),0 6px 24px -8px rgba(0,0,0,0.8)}
  .hyp-gate h2{margin:0 0 6px;font:600 14px/1.2 "Space Grotesk",sans-serif;
    letter-spacing:0.04em;color:#ff2a36}
  .hyp-gate p{margin:0 0 14px;font-size:11.5px;color:rgba(243,239,230,0.6);
    line-height:1.5}
  .hyp-gate code{background:rgba(255,42,54,0.10);color:#ff2a36;padding:1px 5px;
    border-radius:3px;font-size:10.5px}
  .hyp-gate label{display:block;font-size:10px;letter-spacing:0.18em;
    color:rgba(243,239,230,0.45);margin:14px 0 5px;text-transform:uppercase}
  .hyp-gate input{width:100%;padding:9px 11px;background:rgba(255,255,255,0.04);
    color:#f3efe6;border:1px solid rgba(255,42,54,0.25);border-radius:5px;
    font:12px/1 "JetBrains Mono",monospace;outline:none}
  .hyp-gate input:focus{border-color:#ff2a36;background:rgba(255,255,255,0.07)}
  .hyp-gate .row{display:flex;gap:8px;margin-top:18px}
  .hyp-gate button{flex:1;padding:10px 14px;background:#ff2a36;color:#070608;
    border:0;border-radius:5px;font:600 11px/1 "JetBrains Mono",monospace;
    letter-spacing:0.16em;text-transform:uppercase;cursor:pointer}
  .hyp-gate button:hover{background:#ff424d}
  .hyp-gate button.ghost{background:transparent;color:rgba(243,239,230,0.65);
    border:1px solid rgba(255,255,255,0.12)}
  .hyp-gate .err{color:#ff7080;font-size:11px;margin-top:10px}
  .hyp-gate .ok{color:#7ce0a8;font-size:11px;margin-top:10px}
`;

function PatGate({ onUnlock }) {
  const [pat, setPat]       = useStateE("");
  const [branch, setBranch] = useStateE(gh.branch());
  const [busy, setBusy]     = useStateE(false);
  const [err, setErr]       = useStateE("");

  const submit = async (e) => {
    e?.preventDefault();
    if (!pat.trim()) { setErr("Paste a fine-grained PAT."); return; }
    setBusy(true); setErr("");
    gh.setToken(pat.trim());
    gh.setBranch(branch.trim() || DEFAULT_BRANCH);
    try {
      const user = await gh.whoami();
      onUnlock(user);
    } catch (e2) {
      gh.clearToken();
      setErr("That token didn't authenticate. Check it's a fine-grained PAT with `Contents: Read & Write` on this repo.");
      setBusy(false);
    }
  };

  return (
    <>
      <style>{GATE_STYLE}</style>
      <div className="hyp-gate-backdrop">
        <form className="hyp-gate" onSubmit={submit}>
          <h2>OPERATOR CARD · EDITOR</h2>
          <p>
            Paste a <strong>fine-grained GitHub PAT</strong> scoped to
            {" "}<code>{REPO_OWNER}/{REPO_NAME}</code> with
            {" "}<code>Contents: Read &amp; Write</code>.
            The token stays in this browser's <code>localStorage</code> only —
            it's never sent anywhere but <code>api.github.com</code>.
          </p>
          <label>GitHub PAT</label>
          <input
            type="password"
            value={pat}
            onChange={(e) => setPat(e.target.value)}
            placeholder="github_pat_..."
            autoFocus
          />
          <label>Branch</label>
          <input
            type="text"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            placeholder="codex/ecosystem-navigation-staging"
          />
          <div className="row">
            <button type="submit" disabled={busy}>
              {busy ? "Verifying…" : "Unlock editor"}
            </button>
          </div>
          {err && <div className="err">{err}</div>}
        </form>
      </div>
    </>
  );
}

// ── Floating Save button + status pill ────────────────────────────────────
const SAVE_STYLE = `
  .hyp-save{position:fixed;top:16px;right:20px;z-index:2147483645;
    display:flex;align-items:center;gap:10px;font:500 10px/1 "JetBrains Mono",monospace;
    letter-spacing:0.18em;text-transform:uppercase}
  .hyp-save .who{color:rgba(243,239,230,0.45)}
  .hyp-save .status{padding:4px 8px;border-radius:3px;border:1px solid rgba(255,255,255,0.10);
    color:rgba(243,239,230,0.55)}
  .hyp-save .status.dirty{color:#ff2a36;border-color:rgba(255,42,54,0.45);
    background:rgba(255,42,54,0.08)}
  .hyp-save .status.ok{color:#7ce0a8;border-color:rgba(124,224,168,0.40)}
  .hyp-save .status.err{color:#ff7080;border-color:rgba(255,112,128,0.50)}
  .hyp-save button{padding:7px 14px;background:#ff2a36;color:#070608;border:0;border-radius:4px;
    font:600 10px/1 "JetBrains Mono",monospace;letter-spacing:0.20em;text-transform:uppercase;
    cursor:pointer;clip-path:polygon(5px 0,100% 0,100% calc(100% - 5px),calc(100% - 5px) 100%,0 100%,0 5px)}
  .hyp-save button:hover{background:#ff424d}
  .hyp-save button:disabled{background:rgba(255,42,54,0.20);color:rgba(243,239,230,0.40);cursor:not-allowed}
  .hyp-save .signout{padding:6px 10px;background:transparent;color:rgba(243,239,230,0.45);
    border:1px solid rgba(255,255,255,0.08);border-radius:3px;cursor:pointer;
    font:500 9px/1 "JetBrains Mono",monospace;letter-spacing:0.16em;text-transform:uppercase}
  .hyp-save .signout:hover{color:#f3efe6}
`;

function SaveBar({ user, onSignOut }) {
  const [dirty, setDirty]   = useStateE(false);
  const [busy, setBusy]     = useStateE(false);
  const [status, setStatus] = useStateE({ kind: "idle", msg: "" });

  useEffectE(() => {
    const tick = () => setDirty(window.__cardEditor.hasChanges());
    const i = setInterval(tick, 400);
    const onTweak = () => tick();
    window.addEventListener("tweakchange", onTweak);
    return () => { clearInterval(i); window.removeEventListener("tweakchange", onTweak); };
  }, []);

  const save = async () => {
    setBusy(true);
    setStatus({ kind: "idle", msg: "" });
    try {
      const { commits, note } = await window.__cardEditor.save();
      if (note === "no changes") {
        setStatus({ kind: "idle", msg: "no changes" });
      } else {
        const short = commits.map((c) => c.sha.slice(0, 7)).join(" · ");
        setStatus({ kind: "ok", msg: `saved · ${short}` });
      }
      setDirty(false);
    } catch (e) {
      console.error(e);
      setStatus({ kind: "err", msg: String(e.message || e).slice(0, 80) });
    }
    setBusy(false);
  };

  const statusClass = "status " + (dirty ? "dirty" : status.kind);
  const statusText  = status.msg || (dirty ? "unsaved" : "in sync");

  return (
    <>
      <style>{SAVE_STYLE}</style>
      <div className="hyp-save">
        <span className="who">{user?.login ? `@${user.login}` : ""}</span>
        <span className={statusClass}>{statusText}</span>
        <button onClick={save} disabled={busy || !dirty}>
          {busy ? "Saving…" : "Save"}
        </button>
        <button className="signout" onClick={onSignOut}>Sign out</button>
      </div>
    </>
  );
}

// ── Editor App: wraps the public <App /> + adds TweaksPanel + SaveBar ─────
function EditorApp() {
  const [user, setUser] = useStateE(null);

  // PAT bootstrap on mount: if we have a token, verify it; otherwise show
  // the gate. Bad tokens get cleared so the gate reappears.
  useEffectE(() => {
    if (!gh.token()) return;
    gh.whoami().then(setUser).catch(() => { gh.clearToken(); });
  }, []);

  if (!user) {
    return <PatGate onUnlock={setUser} />;
  }

  return (
    <>
      <SaveBar user={user} onSignOut={() => { gh.clearToken(); setUser(null); }} />
      {/* the real card */}
      <window.App />
      {/* the tweaks panel */}
      <TweaksDriver />
    </>
  );
}

// TweaksDriver — lives inside the React tree so it sees tweakchange events
// alongside <App />. Reads the current config from the editor store,
// renders the full TweaksPanel with every editable field.
function TweaksDriver() {
  const cfg = window.__cardEditor.loadedConfig || window.FALLBACK_CONFIG;
  // Build flat defaults the TweaksPanel speaks (doctrine subkeys flattened)
  const flatDefaults = {
    accent: cfg.accent, motion: cfg.motion,
    serial: cfg.serial, name: cfg.name, alias: cfg.alias,
    role: cfg.role, brand: cfg.brand, capability: cfg.capability,
    tagline: cfg.tagline, footTag: cfg.footTag,
    doctrineLabel: cfg.doctrine.label, doctrineVol: cfg.doctrine.vol,
    doctrineTitlePre: cfg.doctrine.titlePre,
    doctrineTitleHighlight: cfg.doctrine.titleHighlight,
    doctrineTitlePost: cfg.doctrine.titlePost,
    doctrineBody: cfg.doctrine.body,
    email: cfg.email, phone: cfg.phone, website: cfg.website,
    link_hyperion: cfg.links.hyperion, link_chronos: cfg.links.chronos,
    link_forge: cfg.links.forge, link_github: cfg.links.github,
    link_instagram: cfg.links.instagram, link_kofi: cfg.links.kofi,
  };
  const [t, setTweak] = useTweaks(flatDefaults);

  return (
    <TweaksPanel title="Operator Card · Edit" noDeckControls>
      <TweakSection label="Identity">
        <TweakText label="Name"       value={t.name}       onChange={(v) => setTweak("name", v)} />
        <TweakText label="Alias"      value={t.alias}      onChange={(v) => setTweak("alias", v)} />
        <TweakText label="Role"       value={t.role}       onChange={(v) => setTweak("role", v)} />
        <TweakText label="Brand"      value={t.brand}      onChange={(v) => setTweak("brand", v)} />
        <TweakText label="Capability" value={t.capability} onChange={(v) => setTweak("capability", v)} />
        <TweakText label="Serial"     value={t.serial}     onChange={(v) => setTweak("serial", v)} />
      </TweakSection>

      <TweakSection label="Voice (front)">
        <TweakText label="Tagline"  value={t.tagline} onChange={(v) => setTweak("tagline", v)} />
        <TweakText label="Foot tag" value={t.footTag} onChange={(v) => setTweak("footTag", v)} />
      </TweakSection>

      <TweakSection label="Doctrine (back)">
        <TweakText label="Label"     value={t.doctrineLabel}          onChange={(v) => setTweak("doctrineLabel", v)} />
        <TweakText label="Volume"    value={t.doctrineVol}            onChange={(v) => setTweak("doctrineVol", v)} />
        <TweakText label="Title ¹"   value={t.doctrineTitlePre}       onChange={(v) => setTweak("doctrineTitlePre", v)} />
        <TweakText label="Highlight" value={t.doctrineTitleHighlight} onChange={(v) => setTweak("doctrineTitleHighlight", v)} />
        <TweakText label="Title ²"   value={t.doctrineTitlePost}      onChange={(v) => setTweak("doctrineTitlePost", v)} />
        <TweakText label="Body"      value={t.doctrineBody}           onChange={(v) => setTweak("doctrineBody", v)} />
      </TweakSection>

      <TweakSection label="Contact">
        <TweakText label="Email"   value={t.email}   onChange={(v) => setTweak("email", v)} />
        <TweakText label="Phone"   value={t.phone}   onChange={(v) => setTweak("phone", v)} />
        <TweakText label="Website" value={t.website} onChange={(v) => setTweak("website", v)} />
      </TweakSection>

      <TweakSection label="Links">
        <TweakText label="Hyperion"  value={t.link_hyperion}  onChange={(v) => setTweak("link_hyperion", v)} />
        <TweakText label="CHR0N.OS"  value={t.link_chronos}   onChange={(v) => setTweak("link_chronos", v)} />
        <TweakText label="Forge"     value={t.link_forge}     onChange={(v) => setTweak("link_forge", v)} />
        <TweakText label="GitHub"    value={t.link_github}    onChange={(v) => setTweak("link_github", v)} />
        <TweakText label="Instagram" value={t.link_instagram} onChange={(v) => setTweak("link_instagram", v)} />
        <TweakText label="Ko-fi"     value={t.link_kofi}      onChange={(v) => setTweak("link_kofi", v)} />
      </TweakSection>

      <TweakSection label="Accent">
        <TweakColor
          label="Hue"
          value={t.accent}
          onChange={(v) => setTweak("accent", v)}
          options={["#ff2a36", "#ff7a18", "#c79a48", "#2bd4a8", "#7c5cff", "#f1f0eb"]}
        />
      </TweakSection>

      <TweakSection label="Motion">
        <TweakRadio
          label="Activation"
          value={t.motion}
          onChange={(v) => setTweak("motion", v)}
          options={[{ value: "on", label: "On" }, { value: "off", label: "Off" }]}
        />
      </TweakSection>
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<EditorApp />);
