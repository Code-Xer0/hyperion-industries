import { B as e, M as t, N as n, O as r, P as i, R as a, T as o, V as s, a as c, f as l, g as u, h as d, i as f, j as p, k as m, l as h, m as g, n as _, o as v, p as y, r as b, s as x, t as S, u as C, v as w, w as ee, x as T, y as E, z as D } from "./Geometry-uzK7Lbb5.js";
import { a as O, c as te, f as ne, i as re, n as k, o as ie, r as A, s as ae } from "./Filter-BHocqa2Q.js";
import { a as oe, c as j, i as se, l as ce, o as M, s as N, u as le } from "./FilterSystem-Thl4iJ0U.js";
import { n as ue, r as de, t as P } from "./canvasUtils-DAQWjL3Q.js";
import { n as F, t as I } from "./Cache-CEQe56KT.js";
import { a as fe, c as L, d as R, f as pe, i as me, l as he, n as ge, o as _e, p as z, r as ve, s as ye, t as be, u as xe } from "./RenderTargetSystem-Bo42fVrD.js";
import { a as Se, c as Ce, d as we, f as Te, i as Ee, l as De, m as Oe, o as ke, p as B, r as Ae, s as je, t as V, u as Me } from "./GCManagedHash-im6pMy80.js";
import { a as Ne, c as Pe, i as Fe, l as Ie, n as Le, o as Re, r as ze, s as Be, t as H, u as Ve } from "./GraphicsContext-BGEZBfgu.js";
import { t as He } from "./getTextureBatchBindGroup-Cc95ygL_.js";
import { t as Ue } from "./CanvasPool-L6W9YqAe.js";
import { a as We, c as Ge, d as Ke, f as qe, i as Je, l as Ye, n as Xe, o as Ze, p as Qe, r as $e, s as et, t as tt, u as nt } from "./BufferResource-Bpr3Qypm.js";
//#region src/runtime/assetLoader.ts
async function rt(e = "/assets/operator/hy60-v2") {
	let t = it(e), n = await at(`${t}/manifest.json`), [r, i] = await Promise.all([at(`${t}/${n.outputs.animationMap}`), at(`${t}/qa/import-validation.json`)]);
	return n.schema === "hyperion.operator.runtime_asset_pack.v2" ? {
		basePath: t,
		manifest: n,
		animationMap: r,
		mode: "animation_sheets",
		atlas: null,
		sheetIndex: await at(`${t}/${n.outputs.sheetIndex}`),
		validation: i
	} : {
		basePath: t,
		manifest: n,
		animationMap: r,
		mode: "legacy_atlas",
		atlas: await at(`${t}/${n.outputs.atlas}`),
		sheetIndex: null,
		validation: i
	};
}
function it(e) {
	let t = String(e || "/assets/operator/hy60-v2").replace(/\/$/, "");
	try {
		return new URL(t, document.baseURI).href.replace(/\/$/, "");
	} catch {
		return t;
	}
}
async function at(e) {
	let t = await fetch(e);
	if (!t.ok) throw Error(`Failed to load ${e}: ${t.status} ${t.statusText}`);
	return t.json();
}
//#endregion
//#region src/generated/operatorAnimations.ts
var ot = /* @__PURE__ */ "idle.running_right.running_left.waving.jumping.failed.waiting.task_running.review.idle_breathe.idle_blink.idle_scan.think.typing.processing.alert.success.error_glitch.sleep.wake.reboot.salute.yes_nod.no_shake.hover.teleport_in.teleport_out.sprint_right.sprint_left.celebrate.landing.shield.inspect.authority_request.blocked_policy.contradiction_detected.memory_write.memory_compact.handoff_to_subagent.tool_executing.approval_wait.degraded_recover.offline_sleep.nest_sync.idle_to_scan.scan_to_command.command_to_review.review_to_execute.execute_to_success.fail_to_recover.alert_to_waiting.wait_to_processing.think_to_review.policy_deny_to_recover.sleep_to_wake.idle_breathe_posture_locked.idle_blink_layered.idle_scan_micro.think_micro.waiting_breathe.review_breathe.alert_breathe.success_breathe.failed_recover_breathe.hover_breathe.shield_breathe".split("."), st = [
	"idle_to_scan",
	"scan_to_command",
	"command_to_review",
	"review_to_execute",
	"execute_to_success",
	"fail_to_recover",
	"alert_to_waiting",
	"wait_to_processing",
	"think_to_review",
	"policy_deny_to_recover",
	"sleep_to_wake"
], ct = [
	"error_glitch",
	"sleep",
	"wake",
	"reboot"
], lt = {
	"session.start": {
		animation: "idle_breathe_posture_locked",
		transition_in: "sleep_to_wake",
		priority: 10
	},
	"prompt.submit": {
		animation: "think_micro",
		transition_in: "idle_to_scan",
		priority: 30
	},
	"tool.pre.shell": {
		animation: "tool_executing",
		transition_in: "scan_to_command",
		priority: 50
	},
	"tool.pre.edit": {
		animation: "typing",
		transition_in: "scan_to_command",
		priority: 50
	},
	"tool.pre.read": {
		animation: "inspect",
		transition_in: "scan_to_command",
		priority: 45
	},
	"tool.post.success": {
		animation: "review_breathe",
		transition_in: "command_to_review",
		priority: 45
	},
	"tool.post.failed": {
		animation: "failed_recover_breathe",
		transition_in: "fail_to_recover",
		priority: 80
	},
	"permission.request": {
		animation: "approval_wait",
		transition_in: "alert_to_waiting",
		priority: 90
	},
	"policy.deny": {
		animation: "blocked_policy",
		transition_in: "policy_deny_to_recover",
		priority: 100
	},
	"memory.write": {
		animation: "memory_write",
		transition_in: "review_to_execute",
		priority: 40
	},
	"compact.pre": {
		animation: "memory_compact",
		transition_in: "think_to_review",
		priority: 70
	},
	"subagent.start": {
		animation: "handoff_to_subagent",
		transition_in: "scan_to_command",
		priority: 65
	},
	"nest.sync": {
		animation: "nest_sync",
		transition_in: "wait_to_processing",
		priority: 30
	},
	"turn.stop.success": {
		animation: "success_breathe",
		transition_in: "execute_to_success",
		priority: 70
	},
	"turn.stop.idle": {
		animation: "idle_breathe_posture_locked",
		transition_in: null,
		priority: 10
	}
}, ut = {
	"running-right": "running_right",
	"running-left": "running_left",
	running: "task_running",
	wave: "waving",
	jump: "jumping"
}, dt = {
	error_glitch: "failed_recover_breathe",
	sleep: "waiting_breathe",
	wake: "idle_breathe_posture_locked",
	reboot: "processing"
}, ft = new Set(ot);
new Set(st);
var pt = new Set(ct);
function mt(e) {
	return !!(e && ft.has(e));
}
function ht(e) {
	return !!(e && pt.has(e));
}
function U(e, t = "idle_breathe_posture_locked") {
	if (!e) return t;
	let n = ut[e] ?? e;
	return mt(n) ? dt[n] ?? n : t;
}
//#endregion
//#region src/runtime/eventRouter.ts
var gt = "idle_breathe_posture_locked", _t = {
	"task.started": {
		animation: "task_running",
		transitionIn: "scan_to_command",
		priority: 50,
		reason: "task execution started"
	},
	"task.progress": {
		animation: "processing",
		transitionIn: "wait_to_processing",
		priority: 45,
		reason: "task is progressing"
	},
	"task.blocked": {
		animation: "alert_breathe",
		transitionIn: "alert_to_waiting",
		priority: 80,
		reason: "task is blocked"
	},
	"task.completed": {
		animation: "success_breathe",
		transitionIn: "execute_to_success",
		priority: 70,
		reason: "task completed"
	},
	"task.failed": {
		animation: "failed_recover_breathe",
		transitionIn: "fail_to_recover",
		priority: 90,
		reason: "task failed; safe recovery state"
	},
	"memory.recall": {
		animation: "think_micro",
		transitionIn: "idle_to_scan",
		priority: 35,
		reason: "memory recall requested"
	},
	"memory.prompt": {
		animation: "waiting_breathe",
		transitionIn: null,
		priority: 25,
		reason: "waiting for memory prompt"
	},
	"chron.alert": {
		animation: "alert_breathe",
		transitionIn: "alert_to_waiting",
		priority: 75,
		reason: "chronology alert"
	},
	"chron.review_required": {
		animation: "review_breathe",
		transitionIn: "command_to_review",
		priority: 55,
		reason: "chronology review required"
	},
	"agent.message": {
		animation: "typing",
		transitionIn: "scan_to_command",
		priority: 45,
		reason: "agent composing message"
	},
	"agent.warning": {
		animation: "alert_breathe",
		transitionIn: "alert_to_waiting",
		priority: 75,
		reason: "agent warning"
	},
	"connect.online": {
		animation: "nest_sync",
		transitionIn: "wait_to_processing",
		priority: 35,
		reason: "connectivity online"
	},
	"connect.degraded": {
		animation: "degraded_recover",
		transitionIn: "alert_to_waiting",
		priority: 75,
		reason: "connectivity degraded"
	},
	"operator.inspect": {
		animation: "inspect",
		transitionIn: "scan_to_command",
		priority: 45,
		reason: "operator inspect action"
	},
	"bridge.offline": {
		animation: "offline_sleep",
		transitionIn: null,
		priority: 25,
		reason: "bridge endpoint offline"
	},
	"bridge.online": {
		animation: "nest_sync",
		transitionIn: "wait_to_processing",
		priority: 30,
		reason: "bridge endpoint online"
	}
};
function vt(e) {
	let t = lt[e.kind];
	if (t) return bt({
		animation: t.animation,
		transitionIn: t.transition_in ?? null,
		priority: t.priority,
		interruptible: t.priority < 85,
		reason: `manifest route for ${e.kind}`,
		routeSource: "manifest"
	});
	let n = _t[e.kind];
	return n ? bt({
		animation: n.animation,
		transitionIn: n.transitionIn ?? null,
		priority: n.priority,
		interruptible: n.priority < 85,
		reason: n.reason,
		routeSource: "compat"
	}) : e.severity === "error" ? bt({
		animation: "failed_recover_breathe",
		transitionIn: "fail_to_recover",
		priority: 80,
		interruptible: !0,
		reason: `fallback error route for ${e.kind}`,
		routeSource: "fallback"
	}) : e.severity === "warning" ? bt({
		animation: "alert_breathe",
		transitionIn: "alert_to_waiting",
		priority: 65,
		interruptible: !0,
		reason: `fallback warning route for ${e.kind}`,
		routeSource: "fallback"
	}) : {
		animation: gt,
		transitionIn: null,
		priority: 10,
		interruptible: !0,
		reason: `default idle route for ${e.kind}`,
		routeSource: "fallback"
	};
}
function yt(e, t, n = "demo", r = xt(e), i) {
	let a = {
		id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
		kind: e,
		type: e,
		source: n,
		severity: r,
		message: t,
		payload: i,
		createdAt: (/* @__PURE__ */ new Date()).toISOString()
	}, o = vt(a);
	return {
		...a,
		type: e,
		resolved: o,
		animation: o.animation,
		priorityLabel: St(o.priority)
	};
}
function bt(e) {
	let t = U(e.animation, gt), n = e.transitionIn ? U(e.transitionIn, gt) : null;
	return ht(e.animation) ? {
		...e,
		animation: t,
		transitionIn: n,
		routeSource: "quarantine",
		reason: `${e.reason}; quarantined state aliased to ${t}`
	} : {
		...e,
		animation: t,
		transitionIn: n
	};
}
function xt(e) {
	return /failed|deny|blocked|offline|error/i.test(e) ? "error" : /warning|alert|degraded|permission/i.test(e) ? "warning" : /success|completed|online/i.test(e) ? "success" : "info";
}
function St(e) {
	return e >= 80 ? "urgent" : e >= 60 ? "high" : e >= 35 ? "normal" : "low";
}
//#endregion
//#region src/runtime/motionController.ts
var Ct = class {
	options;
	transitionTimer = null;
	active = null;
	transitionInterruptible = !0;
	constructor(e) {
		this.options = e;
	}
	request(e, t) {
		if (this.active?.phase === "transition" && !this.transitionInterruptible && e.priority <= this.active.priority) return !1;
		this.clearTransition();
		let n = U(e.animation, "idle_breathe_posture_locked"), r = e.transitionIn ? U(e.transitionIn, "idle_breathe_posture_locked") : null;
		return !r || r === n ? (this.play(n, t, "target", e.priority, e.reason), !0) : (this.play(r, t, "transition", e.priority, e.reason), this.transitionInterruptible = e.interruptible, this.transitionTimer = window.setTimeout(() => {
			this.transitionTimer = null, this.transitionInterruptible = !0, this.play(n, t, "target", e.priority, e.reason);
		}, Math.max(1, this.options.transitionDurationMs)), !0);
	}
	playDirect(e, t, n = "direct animation request") {
		this.clearTransition(), this.transitionInterruptible = !0;
		let r = U(e, "idle_breathe_posture_locked");
		return this.play(r, t, "direct", 0, n), r;
	}
	snapshot() {
		return this.active;
	}
	destroy() {
		this.clearTransition(), this.active = null, this.transitionInterruptible = !0;
	}
	play(e, t, n, r, i) {
		this.options.onPlay(e, t), this.active = {
			animation: e,
			phase: n,
			priority: r,
			reason: i,
			updatedAt: (/* @__PURE__ */ new Date()).toISOString()
		}, this.options.onStateChange?.(this.active);
	}
	clearTransition() {
		this.transitionTimer != null && (window.clearTimeout(this.transitionTimer), this.transitionTimer = null);
	}
}, wt = {
	extension: {
		type: D.Environment,
		name: "browser",
		priority: -1
	},
	test: () => !0,
	load: async () => {
		await import("./browserAll-ntsEh2q0.js");
	}
}, Tt = {
	extension: {
		type: D.Environment,
		name: "webworker",
		priority: 0
	},
	test: () => typeof self < "u" && self.WorkerGlobalScope !== void 0,
	load: async () => {
		await import("./webworkerAll-BY731jBo.js");
	}
}, Et;
function Dt(e) {
	return Et === void 0 && (Et = (() => {
		let t = {
			stencil: !0,
			failIfMajorPerformanceCaveat: e ?? pe.defaultOptions.failIfMajorPerformanceCaveat
		};
		try {
			if (!y.get().getWebGLRenderingContext()) return !1;
			let e = y.get().createCanvas().getContext("webgl", t), n = !!e?.getContextAttributes()?.stencil;
			if (e) {
				let t = e.getExtension("WEBGL_lose_context");
				t && t.loseContext();
			}
			return e = null, n;
		} catch {
			return !1;
		}
	})()), Et;
}
//#endregion
//#region node_modules/pixi.js/lib/utils/browser/isWebGPUSupported.mjs
var Ot;
async function kt(e = {}) {
	return Ot === void 0 && (Ot = await (async () => {
		let t = y.get().getNavigator().gpu;
		if (!t) return !1;
		try {
			return await (await t.requestAdapter(e)).requestDevice(), !0;
		} catch {
			return !1;
		}
	})()), Ot;
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/autoDetectRenderer.mjs
var At = [
	"webgl",
	"webgpu",
	"canvas"
];
async function jt(e) {
	let t = [];
	e.preference ? Array.isArray(e.preference) ? t = e.preference.slice() : (t.push(e.preference), At.forEach((n) => {
		n !== e.preference && t.push(n);
	})) : t = At.slice();
	let n, r = {};
	for (let i = 0; i < t.length; i++) {
		let a = t[i];
		if (a === "webgpu" && await kt()) {
			let { WebGPURenderer: t } = await Promise.resolve().then(() => ts);
			n = t, r = {
				...e,
				...e.webgpu
			};
			break;
		} else if (a === "webgl" && Dt(e.failIfMajorPerformanceCaveat ?? pe.defaultOptions.failIfMajorPerformanceCaveat)) {
			let { WebGLRenderer: t } = await Promise.resolve().then(() => co);
			n = t, r = {
				...e,
				...e.webgl
			};
			break;
		} else if (a === "canvas") {
			let { CanvasRenderer: t } = await Promise.resolve().then(() => Ti);
			n = t, r = {
				...e,
				...e.canvasOptions
			};
			break;
		}
	}
	if (delete r.webgpu, delete r.webgl, delete r.canvasOptions, !n) throw Error("No available renderer for the current environment");
	let i = new n();
	return await i.init(r), i;
}
//#endregion
//#region node_modules/pixi.js/lib/app/ResizePlugin.mjs
var Mt = class {
	static init(e) {
		Object.defineProperty(this, "resizeTo", {
			configurable: !0,
			set(e) {
				globalThis.removeEventListener("resize", this.queueResize), this._resizeTo = e, e && (globalThis.addEventListener("resize", this.queueResize), this.resize());
			},
			get() {
				return this._resizeTo;
			}
		}), this.queueResize = () => {
			this._resizeTo && (this._cancelResize(), this._resizeId = requestAnimationFrame(() => this.resize()));
		}, this._cancelResize = () => {
			this._resizeId &&= (cancelAnimationFrame(this._resizeId), null);
		}, this.resize = () => {
			if (!this._resizeTo) return;
			this._cancelResize();
			let e, t;
			if (this._resizeTo === globalThis.window) e = globalThis.innerWidth, t = globalThis.innerHeight;
			else {
				let { clientWidth: n, clientHeight: r } = this._resizeTo;
				e = n, t = r;
			}
			this.renderer.resize(e, t), this.render();
		}, this._resizeId = null, this._resizeTo = null, this.resizeTo = e.resizeTo || null;
	}
	static destroy() {
		globalThis.removeEventListener("resize", this.queueResize), this._cancelResize(), this._cancelResize = null, this.queueResize = null, this.resizeTo = null, this.resize = null;
	}
};
Mt.extension = D.Application;
//#endregion
//#region node_modules/pixi.js/lib/app/TickerPlugin.mjs
var Nt = class {
	static init(e) {
		e = Object.assign({
			autoStart: !0,
			sharedTicker: !1
		}, e), Object.defineProperty(this, "ticker", {
			configurable: !0,
			set(e) {
				this._ticker && this._ticker.remove(this.render, this), this._ticker = e, e && e.add(this.render, this, re.LOW);
			},
			get() {
				return this._ticker;
			}
		}), this.stop = () => {
			this._ticker.stop();
		}, this.start = () => {
			this._ticker.start();
		}, this._ticker = null, this.ticker = e.sharedTicker ? A.shared : new A(), e.autoStart && this.start();
	}
	static destroy() {
		if (this._ticker) {
			let e = this._ticker;
			this.ticker = null, e.destroy();
		}
	}
};
Nt.extension = D.Application, e.add(Mt), e.add(Nt);
//#endregion
//#region node_modules/pixi.js/lib/app/Application.mjs
var Pt = class e {
	constructor(...e) {
		this.stage = new te(), e[0] !== void 0 && r(m, "Application constructor options are deprecated, please use Application.init() instead.");
	}
	async init(t) {
		t = { ...t }, this.stage ||= new te(), this.renderer = await jt(t), e._plugins.forEach((e) => {
			e.init.call(this, t);
		});
	}
	render() {
		this.renderer.render({ container: this.stage });
	}
	get canvas() {
		return this.renderer.canvas;
	}
	get view() {
		return r(m, "Application.view is deprecated, please use Application.canvas instead."), this.renderer.canvas;
	}
	get screen() {
		return this.renderer.screen;
	}
	get domContainerRoot() {
		return this.renderer.renderPipes.dom?._domElement;
	}
	destroy(t = !1, n = !1) {
		let r = e._plugins.slice(0);
		r.reverse(), r.forEach((e) => {
			e.destroy.call(this);
		}), this.stage.destroy(n), this.stage = null, this.renderer.destroy(t), this.renderer = null;
	}
};
Pt._plugins = [];
var Ft = Pt;
e.handleByList(D.Application, Ft._plugins), e.add(R);
//#endregion
//#region node_modules/pixi.js/lib/scene/text-bitmap/asset/bitmapFontTextParser.mjs
var It = {
	test(e) {
		return typeof e == "string" && e.startsWith("info face=");
	},
	parse(e) {
		let t = e.match(/^[a-z]+\s+.+$/gm), n = {
			info: [],
			common: [],
			page: [],
			char: [],
			chars: [],
			kerning: [],
			kernings: [],
			distanceField: []
		};
		for (let e in t) {
			let r = t[e].match(/^[a-z]+/gm)[0], i = t[e].match(/[a-zA-Z]+=([^\s"']+|"([^"]*)")/gm), a = {};
			for (let e in i) {
				let t = i[e].split("="), n = t[0], r = t[1].replace(/"/gm, ""), o = parseFloat(r);
				a[n] = isNaN(o) ? r : o;
			}
			n[r].push(a);
		}
		let r = {
			chars: {},
			pages: [],
			lineHeight: 0,
			fontSize: 0,
			fontFamily: "",
			distanceField: null,
			baseLineOffset: 0
		}, [i] = n.info, [a] = n.common, [o] = n.distanceField ?? [];
		o && (r.distanceField = {
			range: parseInt(o.distanceRange, 10),
			type: o.fieldType
		}), r.fontSize = parseInt(i.size, 10), r.fontFamily = i.face, r.lineHeight = parseInt(a.lineHeight, 10);
		let s = n.page;
		for (let e = 0; e < s.length; e++) r.pages.push({
			id: parseInt(s[e].id, 10) || 0,
			file: s[e].file
		});
		let c = {};
		r.baseLineOffset = r.lineHeight - parseInt(a.base, 10);
		let l = n.char;
		for (let e = 0; e < l.length; e++) {
			let t = l[e], n = parseInt(t.id, 10), i = t.letter ?? t.char ?? String.fromCharCode(n);
			i === "space" && (i = " "), c[n] = i, r.chars[i] = {
				id: n,
				page: parseInt(t.page, 10) || 0,
				x: parseInt(t.x, 10),
				y: parseInt(t.y, 10),
				width: parseInt(t.width, 10),
				height: parseInt(t.height, 10),
				xOffset: parseInt(t.xoffset, 10),
				yOffset: parseInt(t.yoffset, 10),
				xAdvance: parseInt(t.xadvance, 10),
				kerning: {}
			};
		}
		let u = n.kerning || [];
		for (let e = 0; e < u.length; e++) {
			let t = parseInt(u[e].first, 10), n = parseInt(u[e].second, 10), i = parseInt(u[e].amount, 10);
			r.chars[c[n]] && (r.chars[c[n]].kerning[c[t]] = i);
		}
		return r;
	}
}, Lt = {
	test(e) {
		let t = e;
		return typeof t != "string" && "getElementsByTagName" in t && t.getElementsByTagName("page").length && t.getElementsByTagName("info")[0].getAttribute("face") !== null;
	},
	parse(e) {
		let t = {
			chars: {},
			pages: [],
			lineHeight: 0,
			fontSize: 0,
			fontFamily: "",
			distanceField: null,
			baseLineOffset: 0
		}, n = e.getElementsByTagName("info")[0], r = e.getElementsByTagName("common")[0], i = e.getElementsByTagName("distanceField")[0];
		i && (t.distanceField = {
			type: i.getAttribute("fieldType"),
			range: parseInt(i.getAttribute("distanceRange"), 10)
		});
		let a = e.getElementsByTagName("page"), o = e.getElementsByTagName("char"), s = e.getElementsByTagName("kerning");
		t.fontSize = parseInt(n.getAttribute("size"), 10), t.fontFamily = n.getAttribute("face"), t.lineHeight = parseInt(r.getAttribute("lineHeight"), 10);
		for (let e = 0; e < a.length; e++) t.pages.push({
			id: parseInt(a[e].getAttribute("id"), 10) || 0,
			file: a[e].getAttribute("file")
		});
		let c = {};
		t.baseLineOffset = t.lineHeight - parseInt(r.getAttribute("base"), 10);
		for (let e = 0; e < o.length; e++) {
			let n = o[e], r = parseInt(n.getAttribute("id"), 10), i = n.getAttribute("letter") ?? n.getAttribute("char") ?? String.fromCharCode(r);
			i === "space" && (i = " "), c[r] = i, t.chars[i] = {
				id: r,
				page: parseInt(n.getAttribute("page"), 10) || 0,
				x: parseInt(n.getAttribute("x"), 10),
				y: parseInt(n.getAttribute("y"), 10),
				width: parseInt(n.getAttribute("width"), 10),
				height: parseInt(n.getAttribute("height"), 10),
				xOffset: parseInt(n.getAttribute("xoffset"), 10),
				yOffset: parseInt(n.getAttribute("yoffset"), 10),
				xAdvance: parseInt(n.getAttribute("xadvance"), 10),
				kerning: {}
			};
		}
		for (let e = 0; e < s.length; e++) {
			let n = parseInt(s[e].getAttribute("first"), 10), r = parseInt(s[e].getAttribute("second"), 10), i = parseInt(s[e].getAttribute("amount"), 10);
			t.chars[c[r]] && (t.chars[c[r]].kerning[c[n]] = i);
		}
		return t;
	}
}, Rt = {
	test(e) {
		return typeof e == "string" && e.match(/<font(\s|>)/) ? Lt.test(y.get().parseXML(e)) : !1;
	},
	parse(e) {
		return Lt.parse(y.get().parseXML(e));
	}
}, zt = [".xml", ".fnt"], Bt = {
	extension: {
		type: D.CacheParser,
		name: "cacheBitmapFont"
	},
	test: (e) => !!e?.pages && !!e?.chars && typeof e?.fontFamily == "string" && e.fontFamily !== "",
	getCacheableAssets(e, t) {
		let n = {};
		return e.forEach((e) => {
			n[e] = t, n[`${e}-bitmap`] = t;
		}), n[`${t.fontFamily}-bitmap`] = t, n;
	}
}, Vt = {
	extension: {
		type: D.LoadParser,
		priority: j.Normal
	},
	name: "loadBitmapFont",
	id: "bitmap-font",
	test(e) {
		return zt.includes(N.extname(e).toLowerCase());
	},
	async testParse(e) {
		return It.test(e) || Rt.test(e);
	},
	async parse(e, t, n) {
		let r = It.test(e) ? It.parse(e) : Rt.parse(e), { src: i } = t, { pages: a } = r, o = [], s = r.distanceField ? {
			scaleMode: "linear",
			alphaMode: "premultiply-alpha-on-upload",
			autoGenerateMipmaps: !1,
			resolution: 1
		} : {};
		for (let e = 0; e < a.length; ++e) {
			let t = a[e].file, n = N.join(N.dirname(i), t);
			n = se(n, i), o.push({
				src: n,
				data: s
			});
		}
		let [c, { BitmapFont: l }] = await Promise.all([n.load(o), Promise.resolve().then(() => ls)]);
		return new l({
			data: r,
			textures: o.map((e) => c[e.src])
		}, i);
	},
	async load(e, t) {
		return await (await y.get().fetch(e)).text();
	},
	async unload(e, t, n) {
		await Promise.all(e.pages.map((e) => n.unload(e.texture.source._sourceOrigin))), e.destroy();
	}
}, Ht = class {
	constructor(e, t = !1) {
		this._loader = e, this._assetList = [], this._isLoading = !1, this._maxConcurrent = 1, this.verbose = t;
	}
	add(e) {
		e.forEach((e) => {
			this._assetList.push(e);
		}), this.verbose && console.log("[BackgroundLoader] assets: ", this._assetList), this._isActive && !this._isLoading && this._next();
	}
	async _next() {
		if (this._assetList.length && this._isActive) {
			this._isLoading = !0;
			let e = [], t = Math.min(this._assetList.length, this._maxConcurrent);
			for (let n = 0; n < t; n++) e.push(this._assetList.pop());
			await this._loader.load(e), this._isLoading = !1, this._next();
		}
	}
	get active() {
		return this._isActive;
	}
	set active(e) {
		this._isActive !== e && (this._isActive = e, e && !this._isLoading && this._next());
	}
}, Ut = {
	extension: {
		type: D.CacheParser,
		name: "cacheTextureArray"
	},
	test: (e) => Array.isArray(e) && e.every((e) => e instanceof T),
	getCacheableAssets: (e, t) => {
		let n = {};
		return e.forEach((e) => {
			t.forEach((t, r) => {
				n[e + (r === 0 ? "" : r + 1)] = t;
			});
		}), n;
	}
};
//#endregion
//#region node_modules/pixi.js/lib/assets/detections/utils/testImageFormat.mjs
async function Wt(e) {
	if ("Image" in globalThis) return new Promise((t) => {
		let n = new Image();
		n.onload = () => {
			t(!0);
		}, n.onerror = () => {
			t(!1);
		}, n.src = e;
	});
	if ("createImageBitmap" in globalThis && "fetch" in globalThis) {
		try {
			let t = await (await fetch(e)).blob();
			await createImageBitmap(t);
		} catch {
			return !1;
		}
		return !0;
	}
	return !1;
}
//#endregion
//#region node_modules/pixi.js/lib/assets/detections/parsers/detectAvif.mjs
var Gt = {
	extension: {
		type: D.DetectionParser,
		priority: 1
	},
	test: async () => Wt("data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A="),
	add: async (e) => [...e, "avif"],
	remove: async (e) => e.filter((e) => e !== "avif")
}, Kt = [
	"png",
	"jpg",
	"jpeg"
], qt = {
	extension: {
		type: D.DetectionParser,
		priority: -1
	},
	test: () => Promise.resolve(!0),
	add: async (e) => [...e, ...Kt],
	remove: async (e) => e.filter((e) => !Kt.includes(e))
}, Jt = "WorkerGlobalScope" in globalThis && globalThis instanceof globalThis.WorkerGlobalScope;
function Yt(e) {
	return Jt ? !1 : document.createElement("video").canPlayType(e) !== "";
}
//#endregion
//#region node_modules/pixi.js/lib/assets/detections/parsers/detectMp4.mjs
var Xt = {
	extension: {
		type: D.DetectionParser,
		priority: 0
	},
	test: async () => Yt("video/mp4"),
	add: async (e) => [
		...e,
		"mp4",
		"m4v"
	],
	remove: async (e) => e.filter((e) => e !== "mp4" && e !== "m4v")
}, Zt = {
	extension: {
		type: D.DetectionParser,
		priority: 0
	},
	test: async () => Yt("video/ogg"),
	add: async (e) => [...e, "ogv"],
	remove: async (e) => e.filter((e) => e !== "ogv")
}, Qt = {
	extension: {
		type: D.DetectionParser,
		priority: 0
	},
	test: async () => Yt("video/webm"),
	add: async (e) => [...e, "webm"],
	remove: async (e) => e.filter((e) => e !== "webm")
}, $t = {
	extension: {
		type: D.DetectionParser,
		priority: 0
	},
	test: async () => Wt("data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA="),
	add: async (e) => [...e, "webp"],
	remove: async (e) => e.filter((e) => e !== "webp")
}, en = class e {
	constructor() {
		this.loadOptions = { ...e.defaultOptions }, this._parsers = [], this._parsersValidated = !1, this.parsers = new Proxy(this._parsers, { set: (e, t, n) => (this._parsersValidated = !1, e[t] = n, !0) }), this.promiseCache = {};
	}
	reset() {
		this._parsersValidated = !1, this.promiseCache = {};
	}
	_getLoadPromiseAndParser(e, t) {
		let n = {
			promise: null,
			parser: null
		};
		return n.promise = (async () => {
			let r = null, i = null;
			if ((t.parser || t.loadParser) && (i = this._parserHash[t.parser || t.loadParser], t.loadParser && w(`[Assets] "loadParser" is deprecated, use "parser" instead for ${e}`), i || w(`[Assets] specified load parser "${t.parser || t.loadParser}" not found while loading ${e}`)), !i) {
				for (let n = 0; n < this.parsers.length; n++) {
					let r = this.parsers[n];
					if (r.load && r.test?.(e, t, this)) {
						i = r;
						break;
					}
				}
				if (!i) return w(`[Assets] ${e} could not be loaded as we don't know how to parse it, ensure the correct parser has been added`), null;
			}
			r = await i.load(e, t, this), n.parser = i;
			for (let e = 0; e < this.parsers.length; e++) {
				let i = this.parsers[e];
				i.parse && i.parse && await i.testParse?.(r, t, this) && (r = await i.parse(r, t, this) || r, n.parser = i);
			}
			return r;
		})(), n;
	}
	async load(t, n) {
		this._parsersValidated || this._validateParsers();
		let { onProgress: r, onError: i, strategy: a, retryCount: o, retryDelay: s } = typeof n == "function" ? {
			...e.defaultOptions,
			...this.loadOptions,
			onProgress: n
		} : {
			...e.defaultOptions,
			...this.loadOptions,
			...n || {}
		}, c = 0, l = {}, u = M(t), d = F(t, (e) => ({
			alias: [e],
			src: e,
			data: {}
		})), f = d.reduce((e, t) => e + (t.progressSize || 1), 0), p = d.map(async (e) => {
			let t = N.toAbsolute(e.src);
			l[e.src] || (await this._loadAssetWithRetry(t, e, {
				onProgress: r,
				onError: i,
				strategy: a,
				retryCount: o,
				retryDelay: s
			}, l), c += e.progressSize || 1, r && r(c / f));
		});
		return await Promise.all(p), u ? l[d[0].src] : l;
	}
	async unload(e) {
		let t = F(e, (e) => ({
			alias: [e],
			src: e
		})).map(async (e) => {
			let t = N.toAbsolute(e.src), n = this.promiseCache[t];
			if (n) {
				let r = await n.promise;
				delete this.promiseCache[t], await n.parser?.unload?.(r, e, this);
			}
		});
		await Promise.all(t);
	}
	_validateParsers() {
		this._parsersValidated = !0, this._parserHash = this._parsers.filter((e) => e.name || e.id).reduce((e, t) => (!t.name && !t.id ? w("[Assets] parser should have an id") : (e[t.name] || e[t.id]) && w(`[Assets] parser id conflict "${t.id}"`), e[t.name] = t, t.id && (e[t.id] = t), e), {});
	}
	async _loadAssetWithRetry(e, t, n, r) {
		let i = 0, { onError: a, strategy: o, retryCount: s, retryDelay: c } = n, l = (e) => new Promise((t) => setTimeout(t, e));
		for (;;) try {
			this.promiseCache[e] || (this.promiseCache[e] = this._getLoadPromiseAndParser(e, t)), r[t.src] = await this.promiseCache[e].promise;
			return;
		} catch (n) {
			if (delete this.promiseCache[e], delete r[t.src], i++, o === "retry" && !(o !== "retry" || i > s)) {
				a && a(n, t), await l(c);
				continue;
			}
			if (o === "skip") {
				a && a(n, t);
				return;
			}
			a && a(n, t);
			let u = /* @__PURE__ */ Error(`[Loader.load] Failed to load ${e}.
${n}`);
			throw n instanceof Error && n.stack && (u.stack = n.stack), u;
		}
	}
};
en.defaultOptions = {
	onProgress: void 0,
	onError: void 0,
	strategy: "throw",
	retryCount: 3,
	retryDelay: 250
};
var tn = en;
//#endregion
//#region node_modules/pixi.js/lib/assets/utils/checkDataUrl.mjs
function W(e, t) {
	if (Array.isArray(t)) {
		for (let n of t) if (e.startsWith(`data:${n}`)) return !0;
		return !1;
	}
	return e.startsWith(`data:${t}`);
}
//#endregion
//#region node_modules/pixi.js/lib/assets/utils/checkExtension.mjs
function nn(e, t) {
	let n = e.split("?")[0], r = N.extname(n).toLowerCase();
	return Array.isArray(t) ? t.includes(r) : r === t;
}
//#endregion
//#region node_modules/pixi.js/lib/assets/loader/parsers/loadJson.mjs
var rn = ".json", an = "application/json", on = {
	extension: {
		type: D.LoadParser,
		priority: j.Low
	},
	name: "loadJson",
	id: "json",
	test(e) {
		return W(e, an) || nn(e, rn);
	},
	async load(e) {
		return await (await y.get().fetch(e)).json();
	}
}, sn = ".txt", cn = "text/plain", ln = {
	name: "loadTxt",
	id: "text",
	extension: {
		type: D.LoadParser,
		priority: j.Low,
		name: "loadTxt"
	},
	test(e) {
		return W(e, cn) || nn(e, sn);
	},
	async load(e) {
		return await (await y.get().fetch(e)).text();
	}
}, un = [
	"normal",
	"bold",
	"100",
	"200",
	"300",
	"400",
	"500",
	"600",
	"700",
	"800",
	"900"
], dn = [
	".ttf",
	".otf",
	".woff",
	".woff2"
], fn = [
	"font/ttf",
	"font/otf",
	"font/woff",
	"font/woff2"
], pn = /^(--|-?[A-Z_])[0-9A-Z_-]*$/i;
function mn(e) {
	let t = N.extname(e), n = N.basename(e, t).replace(/(-|_)/g, " ").toLowerCase().split(" ").map((e) => e.charAt(0).toUpperCase() + e.slice(1)), r = n.length > 0;
	for (let e of n) if (!e.match(pn)) {
		r = !1;
		break;
	}
	let i = n.join(" ");
	return r || (i = `"${i.replace(/[\\"]/g, "\\$&")}"`), i;
}
var hn = /^[0-9A-Za-z%:/?#\[\]@!\$&'()\*\+,;=\-._~]*$/;
function gn(e) {
	return hn.test(e) ? e : encodeURI(e);
}
var _n = {
	extension: {
		type: D.LoadParser,
		priority: j.Low
	},
	name: "loadWebFont",
	id: "web-font",
	test(e) {
		return W(e, fn) || nn(e, dn);
	},
	async load(e, t) {
		let n = y.get().getFontFaceSet();
		if (n) {
			let r = [], i = t.data?.family ?? mn(e), a = t.data?.weights?.filter((e) => un.includes(e)) ?? ["normal"], o = t.data ?? {};
			for (let t = 0; t < a.length; t++) {
				let s = a[t], c = new FontFace(i, `url('${gn(e)}')`, {
					...o,
					weight: s
				});
				await c.load(), n.add(c), r.push(c);
			}
			return I.has(`${i}-and-url`) ? I.get(`${i}-and-url`).entries.push({
				url: e,
				faces: r
			}) : I.set(`${i}-and-url`, { entries: [{
				url: e,
				faces: r
			}] }), r.length === 1 ? r[0] : r;
		}
		return w("[loadWebFont] FontFace API is not supported. Skipping loading font"), null;
	},
	unload(e) {
		let t = Array.isArray(e) ? e : [e], n = t[0].family, r = I.get(`${n}-and-url`), i = r.entries.find((e) => e.faces.some((e) => t.indexOf(e) !== -1));
		i.faces = i.faces.filter((e) => t.indexOf(e) === -1), i.faces.length === 0 && (r.entries = r.entries.filter((e) => e !== i)), t.forEach((e) => {
			y.get().getFontFaceSet().delete(e);
		}), r.entries.length === 0 && I.remove(`${n}-and-url`);
	}
};
//#endregion
//#region node_modules/pixi.js/lib/utils/network/getResolutionOfUrl.mjs
function vn(e, t = 1) {
	let n = oe.RETINA_PREFIX?.exec(e);
	return n ? parseFloat(n[1]) : t;
}
//#endregion
//#region node_modules/pixi.js/lib/assets/loader/parsers/textures/utils/createTexture.mjs
function yn(e, t, n) {
	e.label = n, e._sourceOrigin = n;
	let r = new T({
		source: e,
		label: n
	}), i = () => {
		delete t.promiseCache[n], I.has(n) && I.remove(n);
	};
	return r.source.once("destroy", () => {
		t.promiseCache[n] && (w("[Assets] A TextureSource managed by Assets was destroyed instead of unloaded! Use Assets.unload() instead of destroying the TextureSource."), i());
	}), r.once("destroy", () => {
		e.destroyed || (w("[Assets] A Texture managed by Assets was destroyed instead of unloaded! Use Assets.unload() instead of destroying the Texture."), i());
	}), r;
}
//#endregion
//#region node_modules/pixi.js/lib/assets/loader/parsers/textures/loadSVG.mjs
var bn = ".svg", xn = "image/svg+xml", Sn = {
	extension: {
		type: D.LoadParser,
		priority: j.Low,
		name: "loadSVG"
	},
	name: "loadSVG",
	id: "svg",
	config: {
		crossOrigin: "anonymous",
		parseAsGraphicsContext: !1
	},
	test(e) {
		return W(e, xn) || nn(e, bn);
	},
	async load(e, t, n) {
		return t.data?.parseAsGraphicsContext ?? this.config.parseAsGraphicsContext ? wn(e) : Cn(e, t, n, this.config.crossOrigin);
	},
	unload(e) {
		e.destroy(!0);
	}
};
async function Cn(e, t, n, r) {
	let i = await y.get().fetch(e), a = y.get().createImage();
	a.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(await i.text())}`, a.crossOrigin = r, await a.decode();
	let o = t.data?.width ?? a.width, s = t.data?.height ?? a.height, c = t.data?.resolution || vn(e), l = Math.ceil(o * c), u = Math.ceil(s * c), d = y.get().createCanvas(l, u), f = d.getContext("2d");
	f.imageSmoothingEnabled = !0, f.imageSmoothingQuality = "high", f.drawImage(a, 0, 0, o * c, s * c);
	let { parseAsGraphicsContext: p, ...m } = t.data ?? {};
	return yn(new de({
		resource: d,
		alphaMode: "premultiply-alpha-on-upload",
		resolution: c,
		...m
	}), n, e);
}
async function wn(e) {
	let t = await (await y.get().fetch(e)).text(), n = new H();
	return n.svg(t), n;
}
//#endregion
//#region node_modules/pixi.js/lib/_virtual/checkImageBitmap.worker.mjs
var Tn = "(function () {\n    'use strict';\n\n    const WHITE_PNG = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=\";\n    async function checkImageBitmap() {\n      try {\n        if (typeof createImageBitmap !== \"function\") return false;\n        const response = await fetch(WHITE_PNG);\n        const imageBlob = await response.blob();\n        const imageBitmap = await createImageBitmap(imageBlob);\n        return imageBitmap.width === 1 && imageBitmap.height === 1;\n      } catch (_e) {\n        return false;\n      }\n    }\n    void checkImageBitmap().then((result) => {\n      self.postMessage(result);\n    });\n\n})();\n", En = null, Dn = class {
	constructor() {
		En ||= URL.createObjectURL(new Blob([Tn], { type: "application/javascript" })), this.worker = new Worker(En);
	}
};
Dn.revokeObjectURL = function() {
	En &&= (URL.revokeObjectURL(En), null);
};
//#endregion
//#region node_modules/pixi.js/lib/_virtual/loadImageBitmap.worker.mjs
var On = "(function () {\n    'use strict';\n\n    async function loadImageBitmap(url, alphaMode) {\n      const response = await fetch(url);\n      if (!response.ok) {\n        throw new Error(`[WorkerManager.loadImageBitmap] Failed to fetch ${url}: ${response.status} ${response.statusText}`);\n      }\n      const imageBlob = await response.blob();\n      return alphaMode === \"premultiplied-alpha\" ? createImageBitmap(imageBlob, { premultiplyAlpha: \"none\" }) : createImageBitmap(imageBlob);\n    }\n    self.onmessage = async (event) => {\n      try {\n        const imageBitmap = await loadImageBitmap(event.data.data[0], event.data.data[1]);\n        self.postMessage({\n          data: imageBitmap,\n          uuid: event.data.uuid,\n          id: event.data.id\n        }, [imageBitmap]);\n      } catch (e) {\n        self.postMessage({\n          error: e,\n          uuid: event.data.uuid,\n          id: event.data.id\n        });\n      }\n    };\n\n})();\n", kn = null, An = class {
	constructor() {
		kn ||= URL.createObjectURL(new Blob([On], { type: "application/javascript" })), this.worker = new Worker(kn);
	}
};
An.revokeObjectURL = function() {
	kn &&= (URL.revokeObjectURL(kn), null);
};
//#endregion
//#region node_modules/pixi.js/lib/assets/loader/workers/WorkerManager.mjs
var jn = 0, Mn, Nn = new class {
	constructor() {
		this._initialized = !1, this._createdWorkers = 0, this._workerPool = [], this._queue = [], this._resolveHash = {};
	}
	isImageBitmapSupported() {
		return this._isImageBitmapSupported === void 0 && (this._isImageBitmapSupported = new Promise((e) => {
			let { worker: t } = new Dn();
			t.addEventListener("message", (n) => {
				t.terminate(), Dn.revokeObjectURL(), e(n.data);
			});
		})), this._isImageBitmapSupported;
	}
	loadImageBitmap(e, t) {
		return this._run("loadImageBitmap", [e, t?.data?.alphaMode]);
	}
	async _initWorkers() {
		this._initialized ||= !0;
	}
	_getWorker() {
		Mn === void 0 && (Mn = navigator.hardwareConcurrency || 4);
		let e = this._workerPool.pop();
		return !e && this._createdWorkers < Mn && (this._createdWorkers++, e = new An().worker, e.addEventListener("message", (e) => {
			this._complete(e.data), this._returnWorker(e.target), this._next();
		})), e;
	}
	_returnWorker(e) {
		this._workerPool.push(e);
	}
	_complete(e) {
		this._resolveHash[e.uuid] && (e.error === void 0 ? this._resolveHash[e.uuid].resolve(e.data) : this._resolveHash[e.uuid].reject(e.error), delete this._resolveHash[e.uuid]);
	}
	async _run(e, t) {
		await this._initWorkers();
		let n = new Promise((n, r) => {
			this._queue.push({
				id: e,
				arguments: t,
				resolve: n,
				reject: r
			});
		});
		return this._next(), n;
	}
	_next() {
		if (!this._queue.length) return;
		let e = this._getWorker();
		if (!e) return;
		let t = this._queue.pop(), n = t.id;
		this._resolveHash[jn] = {
			resolve: t.resolve,
			reject: t.reject
		}, e.postMessage({
			data: t.arguments,
			uuid: jn++,
			id: n
		});
	}
	reset() {
		this._workerPool.forEach((e) => e.terminate()), this._workerPool.length = 0, Object.values(this._resolveHash).forEach(({ reject: e }) => {
			e?.(/* @__PURE__ */ Error("WorkerManager has been reset before completion"));
		}), this._resolveHash = {}, this._queue.length = 0, this._initialized = !1, this._createdWorkers = 0;
	}
}(), Pn = [
	".jpeg",
	".jpg",
	".png",
	".webp",
	".avif"
], Fn = [
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/avif"
];
async function In(e, t) {
	let n = await y.get().fetch(e);
	if (!n.ok) throw Error(`[loadImageBitmap] Failed to fetch ${e}: ${n.status} ${n.statusText}`);
	let r = await n.blob();
	return t?.data?.alphaMode === "premultiplied-alpha" ? createImageBitmap(r, { premultiplyAlpha: "none" }) : createImageBitmap(r);
}
var Ln = {
	name: "loadTextures",
	id: "texture",
	extension: {
		type: D.LoadParser,
		priority: j.High,
		name: "loadTextures"
	},
	config: {
		preferWorkers: !0,
		preferCreateImageBitmap: !0,
		crossOrigin: "anonymous"
	},
	test(e) {
		return W(e, Fn) || nn(e, Pn);
	},
	async load(e, t, n) {
		let r = null;
		return r = globalThis.createImageBitmap && this.config.preferCreateImageBitmap ? this.config.preferWorkers && await Nn.isImageBitmapSupported() ? await Nn.loadImageBitmap(e, t) : await In(e, t) : await new Promise((t, n) => {
			r = y.get().createImage(), r.crossOrigin = this.config.crossOrigin, r.src = e, r.complete ? t(r) : (r.onload = () => {
				t(r);
			}, r.onerror = n);
		}), yn(new de({
			resource: r,
			alphaMode: "premultiply-alpha-on-upload",
			resolution: t.data?.resolution || vn(e),
			...t.data
		}), n, e);
	},
	unload(e) {
		e.destroy(!0);
	}
}, Rn = [
	".mp4",
	".m4v",
	".webm",
	".ogg",
	".ogv",
	".h264",
	".avi",
	".mov"
], zn, Bn;
function Vn(e, t, n) {
	n === void 0 && !t.startsWith("data:") ? e.crossOrigin = Un(t) : n !== !1 && (e.crossOrigin = typeof n == "string" ? n : "anonymous");
}
function Hn(e) {
	return new Promise((t, n) => {
		e.addEventListener("canplaythrough", r), e.addEventListener("error", i), e.load();
		function r() {
			a(), t();
		}
		function i(e) {
			a(), n(e);
		}
		function a() {
			e.removeEventListener("canplaythrough", r), e.removeEventListener("error", i);
		}
	});
}
function Un(e, t = globalThis.location) {
	if (e.startsWith("data:")) return "";
	t ||= globalThis.location;
	let n = new URL(e, document.baseURI);
	return n.hostname !== t.hostname || n.port !== t.port || n.protocol !== t.protocol ? "anonymous" : "";
}
function Wn() {
	let e = [], t = [];
	for (let n of Rn) {
		let r = ce.MIME_TYPES[n.substring(1)] || `video/${n.substring(1)}`;
		Yt(r) && (e.push(n), t.includes(r) || t.push(r));
	}
	return {
		validVideoExtensions: e,
		validVideoMime: t
	};
}
var Gn = {
	name: "loadVideo",
	id: "video",
	extension: {
		type: D.LoadParser,
		name: "loadVideo"
	},
	test(e) {
		if (!zn || !Bn) {
			let { validVideoExtensions: e, validVideoMime: t } = Wn();
			zn = e, Bn = t;
		}
		let t = W(e, Bn), n = nn(e, zn);
		return t || n;
	},
	async load(e, t, n) {
		let r = {
			...ce.defaultOptions,
			resolution: t.data?.resolution || vn(e),
			alphaMode: t.data?.alphaMode || await le(),
			...t.data
		}, i = document.createElement("video"), a = {
			preload: r.autoLoad === !1 ? void 0 : "auto",
			"webkit-playsinline": r.playsinline === !1 ? void 0 : "",
			playsinline: r.playsinline === !1 ? void 0 : "",
			muted: r.muted === !0 ? "" : void 0,
			loop: r.loop === !0 ? "" : void 0,
			autoplay: r.autoPlay === !1 ? void 0 : ""
		};
		Object.keys(a).forEach((e) => {
			let t = a[e];
			t !== void 0 && i.setAttribute(e, t);
		}), r.muted === !0 && (i.muted = !0), Vn(i, e, r.crossorigin);
		let o = document.createElement("source"), s;
		if (r.mime) s = r.mime;
		else if (e.startsWith("data:")) s = e.slice(5, e.indexOf(";"));
		else if (!e.startsWith("blob:")) {
			let t = e.split("?")[0].slice(e.lastIndexOf(".") + 1).toLowerCase();
			s = ce.MIME_TYPES[t] || `video/${t}`;
		}
		return o.src = e, s && (o.type = s), new Promise((a, s) => {
			r.preload && !r.autoPlay && i.load(), i.addEventListener("canplay", c), i.addEventListener("error", l), o.addEventListener("error", l), i.appendChild(o);
			async function c() {
				let o = new ce({
					...r,
					resource: i
				});
				u(), t.data.preload && await Hn(i), a(yn(o, n, e));
			}
			function l(e) {
				u(), s(e);
			}
			function u() {
				i.removeEventListener("canplay", c), i.removeEventListener("error", l), o.removeEventListener("error", l);
			}
		});
	},
	unload(e) {
		e.destroy(!0);
	}
}, Kn = {
	extension: {
		type: D.ResolveParser,
		name: "resolveTexture"
	},
	test: Ln.test,
	parse: (e) => ({
		resolution: parseFloat(oe.RETINA_PREFIX.exec(e)?.[1] ?? "1"),
		format: e.split(".").pop(),
		src: e
	})
}, qn = {
	extension: {
		type: D.ResolveParser,
		priority: -2,
		name: "resolveJson"
	},
	test: (e) => oe.RETINA_PREFIX.test(e) && e.endsWith(".json"),
	parse: Kn.parse
}, G = new class {
	constructor() {
		this._detections = [], this._initialized = !1, this.resolver = new oe(), this.loader = new tn(), this.cache = I, this._backgroundLoader = new Ht(this.loader), this._backgroundLoader.active = !0, this.reset();
	}
	async init(e = {}) {
		if (this._initialized) {
			w("[Assets]AssetManager already initialized, did you load before calling this Assets.init()?");
			return;
		}
		if (this._initialized = !0, e.defaultSearchParams && this.resolver.setDefaultSearchParams(e.defaultSearchParams), e.basePath && (this.resolver.basePath = e.basePath), e.bundleIdentifier && this.resolver.setBundleIdentifier(e.bundleIdentifier), e.manifest) {
			let t = e.manifest;
			typeof t == "string" && (t = await this.load(t)), this.resolver.addManifest(t);
		}
		let t = e.texturePreference?.resolution ?? 1, n = typeof t == "number" ? [t] : t, r = await this._detectFormats({
			preferredFormats: e.texturePreference?.format,
			skipDetections: e.skipDetections,
			detections: this._detections
		});
		this.resolver.prefer({ params: {
			format: r,
			resolution: n
		} }), e.preferences && this.setPreferences(e.preferences), e.loadOptions && (this.loader.loadOptions = {
			...this.loader.loadOptions,
			...e.loadOptions
		});
	}
	add(e) {
		this.resolver.add(e);
	}
	async load(e, t) {
		this._initialized || await this.init();
		let n = M(e), r = F(e).map((e) => {
			if (typeof e != "string") {
				let t = this.resolver.getAlias(e);
				return t.some((e) => !this.resolver.hasKey(e)) && this.add(e), Array.isArray(t) ? t[0] : t;
			}
			return this.resolver.hasKey(e) || this.add({
				alias: e,
				src: e
			}), e;
		}), i = this.resolver.resolve(r), a = await this._mapLoadToResolve(i, t);
		return n ? a[r[0]] : a;
	}
	addBundle(e, t) {
		this.resolver.addBundle(e, t);
	}
	async loadBundle(e, t) {
		this._initialized || await this.init();
		let n = !1;
		typeof e == "string" && (n = !0, e = [e]);
		let r = this.resolver.resolveBundle(e), i = {}, a = Object.keys(r), o = 0, s = [], c = () => {
			t?.(s.reduce((e, t) => e + t, 0) / o);
		}, l = a.map((e, t) => {
			let n = r[e], a = Object.values(n), l = [...new Set(a.flat())].reduce((e, t) => e + (t.progressSize || 1), 0);
			return s.push(0), o += l, this._mapLoadToResolve(n, (e) => {
				s[t] = e * l, c();
			}).then((t) => {
				i[e] = t;
			});
		});
		return await Promise.all(l), n ? i[e[0]] : i;
	}
	async backgroundLoad(e) {
		this._initialized || await this.init(), typeof e == "string" && (e = [e]);
		let t = this.resolver.resolve(e);
		this._backgroundLoader.add(Object.values(t));
	}
	async backgroundLoadBundle(e) {
		this._initialized || await this.init(), typeof e == "string" && (e = [e]);
		let t = this.resolver.resolveBundle(e);
		Object.values(t).forEach((e) => {
			this._backgroundLoader.add(Object.values(e));
		});
	}
	reset() {
		this.resolver.reset(), this.loader.reset(), this.cache.reset(), this._initialized = !1;
	}
	get(e) {
		if (typeof e == "string") return I.get(e);
		let t = {};
		for (let n = 0; n < e.length; n++) t[n] = I.get(e[n]);
		return t;
	}
	async _mapLoadToResolve(e, t) {
		let n = [...new Set(Object.values(e))];
		this._backgroundLoader.active = !1;
		let r = await this.loader.load(n, t);
		this._backgroundLoader.active = !0;
		let i = {};
		return n.forEach((e) => {
			let t = r[e.src], n = [e.src];
			e.alias && n.push(...e.alias), n.forEach((e) => {
				i[e] = t;
			}), I.set(n, t);
		}), i;
	}
	async unload(e) {
		this._initialized || await this.init();
		let t = F(e).map((e) => typeof e == "string" ? e : e.src), n = this.resolver.resolve(t);
		await this._unloadFromResolved(n);
	}
	async unloadBundle(e) {
		this._initialized || await this.init(), e = F(e);
		let t = this.resolver.resolveBundle(e), n = Object.keys(t).map((e) => this._unloadFromResolved(t[e]));
		await Promise.all(n);
	}
	async _unloadFromResolved(e) {
		let t = Object.values(e);
		t.forEach((e) => {
			I.remove(e.src);
		}), await this.loader.unload(t);
	}
	async _detectFormats(e) {
		let t = [];
		e.preferredFormats && (t = Array.isArray(e.preferredFormats) ? e.preferredFormats : [e.preferredFormats]);
		for (let n of e.detections) e.skipDetections || await n.test() ? t = await n.add(t) : e.skipDetections || (t = await n.remove(t));
		return t = t.filter((e, n) => t.indexOf(e) === n), t;
	}
	get detections() {
		return this._detections;
	}
	setPreferences(e) {
		this.loader.parsers.forEach((t) => {
			t.config && Object.keys(t.config).filter((t) => t in e).forEach((n) => {
				t.config[n] = e[n];
			});
		});
	}
}();
e.handleByList(D.LoadParser, G.loader.parsers).handleByList(D.ResolveParser, G.resolver.parsers).handleByList(D.CacheParser, G.cache.parsers).handleByList(D.DetectionParser, G.detections), e.add(Ut, qt, Gt, $t, Xt, Zt, Qt, on, ln, _n, Sn, Ln, Gn, Vt, Bt, Kn, qn);
var Jn = {
	loader: D.LoadParser,
	resolver: D.ResolveParser,
	cache: D.CacheParser,
	detection: D.DetectionParser
};
e.handle(D.Asset, (t) => {
	let n = t.ref;
	Object.entries(Jn).filter(([e]) => !!n[e]).forEach(([t, r]) => e.add(Object.assign(n[t], { extension: n[t].extension ?? r })));
}, (t) => {
	let n = t.ref;
	Object.keys(Jn).filter((e) => !!n[e]).forEach((t) => e.remove(n[t]));
});
//#endregion
//#region node_modules/pixi.js/lib/scene/graphics/canvas/CanvasGraphicsContextSystem.mjs
var Yn = class {
	constructor() {
		this.isBatchable = !1;
	}
	reset() {
		this.isBatchable = !1, this.context = null, this.graphicsData &&= (this.graphicsData.destroy(), null);
	}
	destroy() {
		this.reset();
	}
}, Xn = class {
	constructor() {
		this.instructions = new g();
	}
	init() {
		this.instructions.reset();
	}
	destroy() {
		this.instructions.destroy(), this.instructions = null;
	}
}, Zn = class e {
	constructor(e) {
		this._renderer = e, this._managedContexts = new V({
			renderer: e,
			type: "resource",
			name: "graphicsContext"
		});
	}
	init(t) {
		e.defaultOptions.bezierSmoothness = t?.bezierSmoothness ?? e.defaultOptions.bezierSmoothness;
	}
	getContextRenderData(e) {
		return this.getGpuContext(e).graphicsData || this._initContextRenderData(e);
	}
	updateGpuContext(e) {
		let t = e._gpuData, n = !!t[this._renderer.uid], r = t[this._renderer.uid] || this._initContext(e);
		return (e.dirty || !n) && (n && r.reset(), r.isBatchable = !1, e.dirty = !1), r;
	}
	getGpuContext(e) {
		return e._gpuData[this._renderer.uid] || this._initContext(e);
	}
	_initContextRenderData(e) {
		let t = new Xn(), n = this.getGpuContext(e);
		return n.graphicsData = t, t.init(), t;
	}
	_initContext(e) {
		let t = new Yn();
		return t.context = e, e._gpuData[this._renderer.uid] = t, this._managedContexts.add(e), t;
	}
	destroy() {
		this._managedContexts.destroy(), this._renderer = null;
	}
};
Zn.extension = {
	type: [D.CanvasSystem],
	name: "graphicsContext"
}, Zn.defaultOptions = { bezierSmoothness: .5 };
var Qn = Zn, $n = class {
	constructor(e, t) {
		this.state = k.for2d(), this.renderer = e, this._adaptor = t, this.renderer.runners.contextChange.add(this), this._managedGraphics = new V({
			renderer: e,
			type: "renderable",
			priority: -1,
			name: "graphics"
		});
	}
	contextChange() {
		this._adaptor.contextChange(this.renderer);
	}
	validateRenderable(e) {
		return !1;
	}
	addRenderable(e, t) {
		this._managedGraphics.add(e), this.renderer.renderPipes.batch.break(t), t.add(e);
	}
	updateRenderable(e) {}
	execute(e) {
		e.isRenderable && this._adaptor.execute(this, e);
	}
	destroy() {
		this._managedGraphics.destroy(), this.renderer = null, this._adaptor.destroy(), this._adaptor = null;
	}
};
$n.extension = {
	type: [D.CanvasPipes],
	name: "graphics"
};
//#endregion
//#region node_modules/pixi.js/lib/scene/graphics/shared/GraphicsPipe.mjs
var er = class {
	constructor() {
		this.batches = [], this.batched = !1;
	}
	destroy() {
		this.batches.forEach((e) => {
			u.return(e);
		}), this.batches.length = 0;
	}
}, tr = class {
	constructor(e, t) {
		this.state = k.for2d(), this.renderer = e, this._adaptor = t, this.renderer.runners.contextChange.add(this), this._managedGraphics = new V({
			renderer: e,
			type: "renderable",
			priority: -1,
			name: "graphics"
		});
	}
	contextChange() {
		this._adaptor.contextChange(this.renderer);
	}
	validateRenderable(e) {
		let t = e.context, n = !!e._gpuData, r = this.renderer.graphicsContext.updateGpuContext(t);
		return !!(r.isBatchable || n !== r.isBatchable);
	}
	addRenderable(e, t) {
		let n = this.renderer.graphicsContext.updateGpuContext(e.context);
		e.didViewUpdate && this._rebuild(e), n.isBatchable ? this._addToBatcher(e, t) : (this.renderer.renderPipes.batch.break(t), t.add(e));
	}
	updateRenderable(e) {
		let t = this._getGpuDataForRenderable(e).batches;
		for (let e = 0; e < t.length; e++) {
			let n = t[e];
			n._batcher.updateElement(n);
		}
	}
	execute(e) {
		if (!e.isRenderable) return;
		let t = this.renderer, n = e.context;
		if (!t.graphicsContext.getGpuContext(n).batches.length) return;
		let r = n.customShader || this._adaptor.shader;
		this.state.blendMode = e.groupBlendMode;
		let i = r.resources.localUniforms.uniforms;
		i.uTransformMatrix = e.groupTransform, i.uRound = t._roundPixels | e._roundPixels, xe(e.groupColorAlpha, i.uColor, 0), this._adaptor.execute(this, e);
	}
	_rebuild(e) {
		let t = this._getGpuDataForRenderable(e), n = this.renderer.graphicsContext.updateGpuContext(e.context);
		t.destroy(), n.isBatchable && this._updateBatchesForRenderable(e, t);
	}
	_addToBatcher(e, t) {
		let n = this.renderer.renderPipes.batch, r = this._getGpuDataForRenderable(e).batches;
		for (let e = 0; e < r.length; e++) {
			let i = r[e];
			n.addToBatch(i, t);
		}
	}
	_getGpuDataForRenderable(e) {
		return e._gpuData[this.renderer.uid] || this._initGpuDataForRenderable(e);
	}
	_initGpuDataForRenderable(e) {
		let t = new er();
		return e._gpuData[this.renderer.uid] = t, this._managedGraphics.add(e), t;
	}
	_updateBatchesForRenderable(e, t) {
		let n = e.context, r = this.renderer.graphicsContext.getGpuContext(n), i = this.renderer._roundPixels | e._roundPixels;
		t.batches = r.batches.map((t) => {
			let n = u.get(Ve);
			return t.copyTo(n), n.renderable = e, n.roundPixels = i, n;
		});
	}
	destroy() {
		this._managedGraphics.destroy(), this.renderer = null, this._adaptor.destroy(), this._adaptor = null, this.state = null;
	}
};
tr.extension = {
	type: [D.WebGLPipes, D.WebGPUPipes],
	name: "graphics"
}, e.add($n), e.add(tr), e.add(Qn), e.add(Ne);
//#endregion
//#region node_modules/pixi.js/lib/scene/graphics/shared/Graphics.mjs
var nr = class e extends ae {
	constructor(e) {
		e instanceof H && (e = { context: e });
		let { context: t, roundPixels: n, ...r } = e || {};
		super({
			label: "Graphics",
			...r
		}), this.renderPipeId = "graphics", t ? this.context = t : (this.context = this._ownedContext = new H(), this.context.autoGarbageCollect = this.autoGarbageCollect), this.didViewUpdate = !0, this.allowChildren = !1, this.roundPixels = n ?? !1;
	}
	set context(e) {
		e !== this._context && (this._context && (this._context.off("update", this.onViewUpdate, this), this._context.off("unload", this.unload, this)), this._context = e, this._context.on("update", this.onViewUpdate, this), this._context.on("unload", this.unload, this), this.onViewUpdate());
	}
	get context() {
		return this._context;
	}
	get bounds() {
		return this._context.bounds;
	}
	updateBounds() {}
	containsPoint(e) {
		return this._context.containsPoint(e);
	}
	destroy(e) {
		this._ownedContext && !e ? this._ownedContext.destroy(e) : (e === !0 || e?.context === !0) && this._context.destroy(e), this._ownedContext = null, this._context = null, super.destroy(e);
	}
	_onTouch(e) {
		this._gcLastUsed = e, this._context._gcLastUsed = e;
	}
	_callContextMethod(e, t) {
		return this.context[e](...t), this;
	}
	setFillStyle(...e) {
		return this._callContextMethod("setFillStyle", e);
	}
	setStrokeStyle(...e) {
		return this._callContextMethod("setStrokeStyle", e);
	}
	fill(...e) {
		return this._callContextMethod("fill", e);
	}
	stroke(...e) {
		return this._callContextMethod("stroke", e);
	}
	texture(...e) {
		return this._callContextMethod("texture", e);
	}
	beginPath() {
		return this._callContextMethod("beginPath", []);
	}
	cut() {
		return this._callContextMethod("cut", []);
	}
	arc(...e) {
		return this._callContextMethod("arc", e);
	}
	arcTo(...e) {
		return this._callContextMethod("arcTo", e);
	}
	arcToSvg(...e) {
		return this._callContextMethod("arcToSvg", e);
	}
	bezierCurveTo(...e) {
		return this._callContextMethod("bezierCurveTo", e);
	}
	closePath() {
		return this._callContextMethod("closePath", []);
	}
	ellipse(...e) {
		return this._callContextMethod("ellipse", e);
	}
	circle(...e) {
		return this._callContextMethod("circle", e);
	}
	path(...e) {
		return this._callContextMethod("path", e);
	}
	lineTo(...e) {
		return this._callContextMethod("lineTo", e);
	}
	moveTo(...e) {
		return this._callContextMethod("moveTo", e);
	}
	quadraticCurveTo(...e) {
		return this._callContextMethod("quadraticCurveTo", e);
	}
	rect(...e) {
		return this._callContextMethod("rect", e);
	}
	roundRect(...e) {
		return this._callContextMethod("roundRect", e);
	}
	poly(...e) {
		return this._callContextMethod("poly", e);
	}
	regularPoly(...e) {
		return this._callContextMethod("regularPoly", e);
	}
	roundPoly(...e) {
		return this._callContextMethod("roundPoly", e);
	}
	roundShape(...e) {
		return this._callContextMethod("roundShape", e);
	}
	filletRect(...e) {
		return this._callContextMethod("filletRect", e);
	}
	chamferRect(...e) {
		return this._callContextMethod("chamferRect", e);
	}
	star(...e) {
		return this._callContextMethod("star", e);
	}
	svg(...e) {
		return this._callContextMethod("svg", e);
	}
	restore(...e) {
		return this._callContextMethod("restore", e);
	}
	save() {
		return this._callContextMethod("save", []);
	}
	getTransform() {
		return this.context.getTransform();
	}
	resetTransform() {
		return this._callContextMethod("resetTransform", []);
	}
	rotateTransform(...e) {
		return this._callContextMethod("rotate", e);
	}
	scaleTransform(...e) {
		return this._callContextMethod("scale", e);
	}
	setTransform(...e) {
		return this._callContextMethod("setTransform", e);
	}
	transform(...e) {
		return this._callContextMethod("transform", e);
	}
	translateTransform(...e) {
		return this._callContextMethod("translate", e);
	}
	clear() {
		return this._callContextMethod("clear", []);
	}
	get fillStyle() {
		return this._context.fillStyle;
	}
	set fillStyle(e) {
		this._context.fillStyle = e;
	}
	get strokeStyle() {
		return this._context.strokeStyle;
	}
	set strokeStyle(e) {
		this._context.strokeStyle = e;
	}
	clone(t = !1) {
		return t ? new e(this._context.clone()) : (this._ownedContext = null, new e(this._context));
	}
	lineStyle(e, t, n) {
		r(m, "Graphics#lineStyle is no longer needed. Use Graphics#setStrokeStyle to set the stroke style.");
		let i = {};
		return e && (i.width = e), t && (i.color = t), n && (i.alpha = n), this.context.strokeStyle = i, this;
	}
	beginFill(e, t) {
		r(m, "Graphics#beginFill is no longer needed. Use Graphics#fill to fill the shape with the desired style.");
		let n = {};
		return e !== void 0 && (n.color = e), t !== void 0 && (n.alpha = t), this.context.fillStyle = n, this;
	}
	endFill() {
		r(m, "Graphics#endFill is no longer needed. Use Graphics#fill to fill the shape with the desired style."), this.context.fill();
		let e = this.context.strokeStyle;
		return (e.width !== H.defaultStrokeStyle.width || e.color !== H.defaultStrokeStyle.color || e.alpha !== H.defaultStrokeStyle.alpha) && this.context.stroke(), this;
	}
	drawCircle(...e) {
		return r(m, "Graphics#drawCircle has been renamed to Graphics#circle"), this._callContextMethod("circle", e);
	}
	drawEllipse(...e) {
		return r(m, "Graphics#drawEllipse has been renamed to Graphics#ellipse"), this._callContextMethod("ellipse", e);
	}
	drawPolygon(...e) {
		return r(m, "Graphics#drawPolygon has been renamed to Graphics#poly"), this._callContextMethod("poly", e);
	}
	drawRect(...e) {
		return r(m, "Graphics#drawRect has been renamed to Graphics#rect"), this._callContextMethod("rect", e);
	}
	drawRoundedRect(...e) {
		return r(m, "Graphics#drawRoundedRect has been renamed to Graphics#roundRect"), this._callContextMethod("roundRect", e);
	}
	drawStar(...e) {
		return r(m, "Graphics#drawStar has been renamed to Graphics#star"), this._callContextMethod("star", e);
	}
}, rr = class {
	constructor(e = 0, t = 0, n = !1) {
		this.first = null, this.items = Object.create(null), this.last = null, this.max = e, this.resetTtl = n, this.size = 0, this.ttl = t;
	}
	clear() {
		return this.first = null, this.items = Object.create(null), this.last = null, this.size = 0, this;
	}
	delete(e) {
		if (this.has(e)) {
			let t = this.items[e];
			delete this.items[e], this.size--, t.prev !== null && (t.prev.next = t.next), t.next !== null && (t.next.prev = t.prev), this.first === t && (this.first = t.next), this.last === t && (this.last = t.prev);
		}
		return this;
	}
	entries(e = this.keys()) {
		let t = Array(e.length);
		for (let n = 0; n < e.length; n++) {
			let r = e[n];
			t[n] = [r, this.get(r)];
		}
		return t;
	}
	evict(e = !1) {
		if (e || this.size > 0) {
			let e = this.first;
			delete this.items[e.key], --this.size === 0 ? (this.first = null, this.last = null) : (this.first = e.next, this.first.prev = null);
		}
		return this;
	}
	expiresAt(e) {
		let t;
		return this.has(e) && (t = this.items[e].expiry), t;
	}
	get(e) {
		let t = this.items[e];
		if (t !== void 0) {
			if (this.ttl > 0 && t.expiry <= Date.now()) {
				this.delete(e);
				return;
			}
			return this.moveToEnd(t), t.value;
		}
	}
	has(e) {
		return e in this.items;
	}
	moveToEnd(e) {
		this.last !== e && (e.prev !== null && (e.prev.next = e.next), e.next !== null && (e.next.prev = e.prev), this.first === e && (this.first = e.next), e.prev = this.last, e.next = null, this.last !== null && (this.last.next = e), this.last = e, this.first === null && (this.first = e));
	}
	keys() {
		let e = Array(this.size), t = this.first, n = 0;
		for (; t !== null;) e[n++] = t.key, t = t.next;
		return e;
	}
	setWithEvicted(e, t, n = this.resetTtl) {
		let r = null;
		if (this.has(e)) this.set(e, t, !0, n);
		else {
			this.max > 0 && this.size === this.max && (r = { ...this.first }, this.evict(!0));
			let n = this.items[e] = {
				expiry: this.ttl > 0 ? Date.now() + this.ttl : this.ttl,
				key: e,
				prev: this.last,
				next: null,
				value: t
			};
			++this.size === 1 ? this.first = n : this.last.next = n, this.last = n;
		}
		return r;
	}
	set(e, t, n = !1, r = this.resetTtl) {
		let i = this.items[e];
		return n || i !== void 0 ? (i.value = t, n === !1 && r && (i.expiry = this.ttl > 0 ? Date.now() + this.ttl : this.ttl), this.moveToEnd(i)) : (this.max > 0 && this.size === this.max && this.evict(!0), i = this.items[e] = {
			expiry: this.ttl > 0 ? Date.now() + this.ttl : this.ttl,
			key: e,
			prev: this.last,
			next: null,
			value: t
		}, ++this.size === 1 ? this.first = i : this.last.next = i, this.last = i), this;
	}
	values(e = this.keys()) {
		let t = Array(e.length);
		for (let n = 0; n < e.length; n++) t[n] = this.get(e[n]);
		return t;
	}
};
function ir(e = 1e3, t = 0, n = !1) {
	if (isNaN(e) || e < 0) throw TypeError("Invalid max value");
	if (isNaN(t) || t < 0) throw TypeError("Invalid ttl value");
	if (typeof n != "boolean") throw TypeError("Invalid resetTtl value");
	return new rr(e, t, n);
}
//#endregion
//#region node_modules/pixi.js/lib/scene/text/canvas/utils/parseTaggedText.mjs
function ar(e) {
	return !!e.tagStyles && Object.keys(e.tagStyles).length > 0;
}
function or(e) {
	return e.includes("<");
}
function sr(e, t) {
	return e.clone().assign(t);
}
function cr(e, t) {
	let n = [], r = t.tagStyles;
	if (!ar(t) || !or(e)) return n.push({
		text: e,
		style: t
	}), n;
	let i = [t], a = [], o = "", s = 0;
	for (; s < e.length;) {
		let t = e[s];
		if (t === "<") {
			let c = e.indexOf(">", s);
			if (c === -1) {
				o += t, s++;
				continue;
			}
			let l = e.indexOf("<", s + 1);
			if (l !== -1 && l < c) {
				o += t, s++;
				continue;
			}
			let u = e.slice(s + 1, c);
			if (u.startsWith("/")) {
				let t = u.slice(1).trim();
				if (a.length > 0 && a[a.length - 1] === t) {
					o.length > 0 && (n.push({
						text: o,
						style: i[i.length - 1]
					}), o = ""), i.pop(), a.pop(), s = c + 1;
					continue;
				} else {
					o += e.slice(s, c + 1), s = c + 1;
					continue;
				}
			} else {
				let t = u.trim();
				if (r[t]) {
					o.length > 0 && (n.push({
						text: o,
						style: i[i.length - 1]
					}), o = "");
					let e = i[i.length - 1], l = sr(e, r[t]);
					i.push(l), a.push(t), s = c + 1;
					continue;
				} else {
					o += e.slice(s, c + 1), s = c + 1;
					continue;
				}
			}
		} else o += t, s++;
	}
	return o.length > 0 && n.push({
		text: o,
		style: i[i.length - 1]
	}), n;
}
var lr = /* @__PURE__ */ new Set([10, 13]), ur = /* @__PURE__ */ new Set([
	9,
	32,
	8192,
	8193,
	8194,
	8195,
	8196,
	8197,
	8198,
	8200,
	8201,
	8202,
	8287,
	12288
]), dr = /* @__PURE__ */ new Set([9, 32]), fr = /* @__PURE__ */ new Set([
	45,
	8208,
	8211,
	8212,
	173
]), pr = /(\r\n|\r|\n)/, mr = /(?:\r\n|\r|\n)/;
function hr(e) {
	return typeof e == "string" ? lr.has(e.charCodeAt(0)) : !1;
}
function K(e, t) {
	return typeof e == "string" ? ur.has(e.charCodeAt(0)) : !1;
}
function gr(e) {
	return typeof e == "string" ? dr.has(e.charCodeAt(0)) : !1;
}
function _r(e) {
	return typeof e == "string" ? fr.has(e.charCodeAt(0)) : !1;
}
function vr(e) {
	return e === "normal" || e === "pre-line";
}
function yr(e) {
	return e === "normal";
}
function q(e) {
	if (typeof e != "string") return "";
	let t = e.length - 1;
	for (; t >= 0 && K(e[t]);) t--;
	return t < e.length - 1 ? e.slice(0, t + 1) : e;
}
function br(e) {
	let t = [], n = [];
	if (typeof e != "string") return t;
	for (let r = 0; r < e.length; r++) {
		let i = e[r], a = e[r + 1];
		if (K(i, a) || hr(i)) {
			n.length > 0 && (t.push(n.join("")), n.length = 0), i === "\r" && a === "\n" ? (t.push("\r\n"), r++) : t.push(i);
			continue;
		}
		n.push(i), _r(i) && a && !K(a) && !hr(a) && (t.push(n.join("")), n.length = 0);
	}
	return n.length > 0 && t.push(n.join("")), t;
}
function xr(e, t, n, r) {
	let i = n(e), a = [];
	for (let n = 0; n < i.length; n++) {
		let o = i[n], s = o, c = 1;
		for (; i[n + c];) {
			let a = i[n + c];
			if (!r(s, a, e, n, t)) o += a, s = a, c++;
			else break;
		}
		n += c - 1, a.push(o);
	}
	return a;
}
//#endregion
//#region node_modules/pixi.js/lib/scene/text/canvas/utils/measureTaggedText.mjs
var Sr = /\r\n|\r|\n/g;
function Cr(e, t, n, r, i, a, o, s, c) {
	let l = cr(e, t);
	if (yr(t.whiteSpace)) for (let e = 0; e < l.length; e++) {
		let t = l[e];
		l[e] = {
			text: t.text.replace(Sr, " "),
			style: t.style
		};
	}
	let u = [], d = [];
	for (let e of l) {
		let t = e.text.split(pr);
		for (let n = 0; n < t.length; n++) {
			let r = t[n];
			r === "\r\n" || r === "\r" || r === "\n" ? (u.push(d), d = []) : r.length > 0 && d.push({
				text: r,
				style: e.style
			});
		}
	}
	(d.length > 0 || u.length === 0) && u.push(d);
	let f = n ? wr(u, t, r, a, s, c) : u, p = [], m = [], h = [], g = [], _ = [], v = 0, y = t._fontString, b = o(y);
	b.fontSize === 0 && (b.fontSize = t.fontSize, b.ascent = t.fontSize);
	let x = "", S = !!t.dropShadow, C = t._stroke?.width || 0;
	for (let e of f) {
		let n = 0, a = b.ascent, s = b.descent, c = "";
		for (let t of e) {
			let e = t.style._fontString, l = o(e);
			e !== x && (r.font = e, x = e);
			let u = i(t.text, t.style.letterSpacing, r);
			n += u, a = Math.max(a, l.ascent), s = Math.max(s, l.descent), c += t.text;
			let d = t.style._stroke?.width || 0;
			d > C && (C = d), !S && t.style.dropShadow && (S = !0);
		}
		e.length === 0 && (a = b.ascent, s = b.descent), p.push(n), m.push(a), h.push(s), _.push(c);
		let l = t.lineHeight || a + s;
		g.push(l + t.leading), v = Math.max(v, n);
	}
	let w = C, ee = v + w + (t.dropShadow ? t.dropShadow.distance : 0), T = 0;
	for (let e = 0; e < g.length; e++) T += g[e];
	return T = Math.max(T, g[0] + w), {
		width: ee,
		height: T + (t.dropShadow ? t.dropShadow.distance : 0),
		lines: _,
		lineWidths: p,
		lineHeight: (t.lineHeight || b.fontSize) + t.leading,
		maxLineWidth: v,
		fontProperties: b,
		runsByLine: f,
		lineAscents: m,
		lineDescents: h,
		lineHeights: g,
		hasDropShadow: S
	};
}
function wr(e, t, n, r, i, a) {
	let { letterSpacing: o, whiteSpace: s, wordWrapWidth: c, breakWords: l } = t, u = vr(s), d = c + o, f = {}, p = "", m = (e, t) => {
		let i = `${e}|${t.styleKey}`, a = f[i];
		if (a === void 0) {
			let o = t._fontString;
			o !== p && (n.font = o, p = o), a = r(e, t.letterSpacing, n) + t.letterSpacing, f[i] = a;
		}
		return a;
	}, h = [];
	for (let t of e) {
		let e = Tr(t), n = h.length, r = (t) => {
			let n = 0, r = t;
			do {
				let { token: t, style: i } = e[r];
				n += m(t, i), r++;
			} while (r < e.length && e[r].continuesFromPrevious);
			return n;
		}, o = (t) => {
			let n = [], r = t;
			do
				n.push({
					token: e[r].token,
					style: e[r].style
				}), r++;
			while (r < e.length && e[r].continuesFromPrevious);
			return n;
		}, s = [], c = 0, f = !u, p = null, g = () => {
			p && p.text.length > 0 && s.push(p), p = null;
		}, _ = () => {
			if (g(), s.length > 0) {
				let e = s[s.length - 1];
				e.text = q(e.text), e.text.length === 0 && s.pop();
			}
			h.push(s), s = [], c = 0, f = !1;
		};
		for (let t = 0; t < e.length; t++) {
			let { token: n, style: v, continuesFromPrevious: y } = e[t], b = m(n, v);
			if (u) {
				let e = K(n), t = p?.text[p.text.length - 1] ?? s[s.length - 1]?.text.slice(-1) ?? "", r = t ? K(t) : !1;
				if (e && r) continue;
			}
			let x = !y, S = x ? r(t) : b;
			if (S > d && x) if (c > 0 && _(), l) {
				let e = o(t);
				for (let t = 0; t < e.length; t++) {
					let n = e[t].token, r = e[t].style, o = xr(n, l, a, i);
					for (let e of o) {
						let t = m(e, r);
						t + c > d && _(), !p || p.style !== r ? (g(), p = {
							text: e,
							style: r
						}) : p.text += e, c += t;
					}
				}
				t += e.length - 1;
			} else {
				let e = o(t);
				g(), h.push(e.map((e) => ({
					text: e.token,
					style: e.style
				}))), f = !1, t += e.length - 1;
			}
			else if (S + c > d && x) {
				if (K(n)) {
					f = !1;
					continue;
				}
				_(), p = {
					text: n,
					style: v
				}, c = b;
			} else if (y && !l) !p || p.style !== v ? (g(), p = {
				text: n,
				style: v
			}) : p.text += n, c += b;
			else {
				let e = K(n);
				if (c === 0 && e && !f) continue;
				!p || p.style !== v ? (g(), p = {
					text: n,
					style: v
				}) : p.text += n, c += b;
			}
		}
		if (g(), s.length > 0) {
			let e = s[s.length - 1];
			e.text = q(e.text), e.text.length === 0 && s.pop();
		}
		(s.length > 0 || h.length === n) && h.push(s);
	}
	return h;
}
function Tr(e) {
	let t = [], n = !1;
	for (let r of e) {
		let e = br(r.text), i = !0;
		for (let a of e) {
			let e = K(a) || hr(a), o = i && n && !e;
			t.push({
				token: a,
				style: r.style,
				continuesFromPrevious: o
			}), n = !e, i = !1;
		}
	}
	return t;
}
//#endregion
//#region node_modules/pixi.js/lib/scene/text/canvas/utils/wordWrap.mjs
var Er = { willReadFrequently: !0 };
function Dr(e, t, n, r, i) {
	let a = n[e];
	return typeof a != "number" && (a = i(e, t, r) + t, n[e] = a), a;
}
function Or(e, t, n, r, i, a, o) {
	let s = n.getContext("2d", Er);
	s.font = t._fontString;
	let c = 0, l = "", u = [], d = /* @__PURE__ */ Object.create(null), { letterSpacing: f, whiteSpace: p } = t, m = vr(p), h = yr(p), g = !m, _ = t.wordWrapWidth + f, v = br(e);
	for (let e = 0; e < v.length; e++) {
		let n = v[e];
		if (hr(n)) {
			if (!h) {
				u.push(q(l)), g = !m, l = "", c = 0;
				continue;
			}
			n = " ";
		}
		if (m) {
			let e = K(n), t = K(l[l.length - 1]);
			if (e && t) continue;
		}
		let p = Dr(n, f, d, s, r);
		if (p > _) if (l !== "" && (u.push(q(l)), l = "", c = 0), i(n, t.breakWords)) {
			let e = xr(n, t.breakWords, o, a);
			for (let t of e) {
				let e = Dr(t, f, d, s, r);
				e + c > _ && (u.push(q(l)), g = !1, l = "", c = 0), l += t, c += e;
			}
		} else l.length > 0 && (u.push(q(l)), l = "", c = 0), u.push(q(n)), g = !1, l = "", c = 0;
		else p + c > _ && (g = !1, u.push(q(l)), l = "", c = 0), (l.length > 0 || !K(n) || g) && (l += n, c += p);
	}
	let y = q(l);
	return y.length > 0 && u.push(y), u.join("\n");
}
//#endregion
//#region node_modules/pixi.js/lib/scene/text/canvas/CanvasTextMetrics.mjs
var kr = { willReadFrequently: !0 }, J = class e {
	static get experimentalLetterSpacingSupported() {
		let t = e._experimentalLetterSpacingSupported;
		if (t === void 0) {
			let n = y.get().getCanvasRenderingContext2D().prototype;
			t = e._experimentalLetterSpacingSupported = "letterSpacing" in n || "textLetterSpacing" in n;
		}
		return t;
	}
	constructor(e, t, n, r, i, a, o, s, c, l) {
		this.text = e, this.style = t, this.width = n, this.height = r, this.lines = i, this.lineWidths = a, this.lineHeight = o, this.maxLineWidth = s, this.fontProperties = c, l && (this.runsByLine = l.runsByLine, this.lineAscents = l.lineAscents, this.lineDescents = l.lineDescents, this.lineHeights = l.lineHeights, this.hasDropShadow = l.hasDropShadow);
	}
	static measureText(t = " ", n, r = e._canvas, i = n.wordWrap) {
		let a = `${t}-${n.styleKey}-wordWrap-${i}`;
		if (e._measurementCache.has(a)) return e._measurementCache.get(a);
		if (ar(n) && or(t)) {
			let r = Cr(t, n, i, e._context, e._measureText, e._measureTextAdvance, e.measureFont, e.canBreakChars, e.wordWrapSplit), o = new e(t, n, r.width, r.height, r.lines, r.lineWidths, r.lineHeight, r.maxLineWidth, r.fontProperties, {
				runsByLine: r.runsByLine,
				lineAscents: r.lineAscents,
				lineDescents: r.lineDescents,
				lineHeights: r.lineHeights,
				hasDropShadow: r.hasDropShadow
			});
			return e._measurementCache.set(a, o), o;
		}
		let o = n._fontString, s = e.measureFont(o);
		s.fontSize === 0 && (s.fontSize = n.fontSize, s.ascent = n.fontSize, s.descent = 0);
		let c = e._context;
		c.font = o;
		let l = (i ? e._wordWrap(t, n, r) : t).split(mr), u = Array(l.length), d = 0;
		for (let t = 0; t < l.length; t++) {
			let r = e._measureText(l[t], n.letterSpacing, c);
			u[t] = r, d = Math.max(d, r);
		}
		let f = n._stroke?.width ?? 0, p = n.lineHeight || s.fontSize, m = e._adjustWidthForStyle(d, n), h = Math.max(p, s.fontSize + f) + (l.length - 1) * (p + n.leading), g = new e(t, n, m, e._adjustHeightForStyle(h, n), l, u, p + n.leading, d, s);
		return e._measurementCache.set(a, g), g;
	}
	static _adjustWidthForStyle(e, t) {
		let n = e + (t._stroke?.width || 0);
		return t.dropShadow && (n += t.dropShadow.distance), n;
	}
	static _adjustHeightForStyle(e, t) {
		let n = e;
		return t.dropShadow && (n += t.dropShadow.distance), n;
	}
	static _measureText(t, n, r) {
		let { metricWidth: i, metrics: a, letterSpacingVal: o } = e._measureTextCore(t, n, r), s = -(a.actualBoundingBoxLeft ?? 0), c = (a.actualBoundingBoxRight ?? 0) - s;
		return a.width > 0 && (c += o), Math.max(i, c);
	}
	static _measureTextAdvance(t, n, r) {
		return e._measureTextCore(t, n, r).metricWidth;
	}
	static _measureTextCore(t, n, r) {
		let i = !1;
		e.experimentalLetterSpacingSupported && (e.experimentalLetterSpacing ? (r.letterSpacing = `${n}px`, r.textLetterSpacing = `${n}px`, i = !0) : (r.letterSpacing = "0px", r.textLetterSpacing = "0px"));
		let a = r.measureText(t), o = a.width, s = 0;
		return o > 0 && (s = i ? -n : (e.graphemeSegmenter(t).length - 1) * n, o += s), {
			metricWidth: o,
			metrics: a,
			letterSpacingVal: s
		};
	}
	static _wordWrap(t, n, r = e._canvas) {
		return Or(t, n, r, e._measureTextAdvance, e.canBreakWords, e.canBreakChars, e.wordWrapSplit);
	}
	static isBreakingSpace(e, t) {
		return K(e, t);
	}
	static canBreakWords(e, t) {
		return t;
	}
	static canBreakChars(e, t, n, r, i) {
		return !0;
	}
	static wordWrapSplit(t) {
		return e.graphemeSegmenter(t);
	}
	static measureFont(t) {
		if (e._fonts[t]) return e._fonts[t];
		let n = e._context;
		n.font = t;
		let r = n.measureText(e.METRICS_STRING + e.BASELINE_SYMBOL), i = r.actualBoundingBoxAscent ?? 0, a = r.actualBoundingBoxDescent ?? 0, o = {
			ascent: i,
			descent: a,
			fontSize: i + a
		};
		return e._fonts[t] = o, o;
	}
	static clearMetrics(t = "") {
		t ? delete e._fonts[t] : e._fonts = {};
	}
	static get _canvas() {
		if (!e.__canvas) {
			let t;
			try {
				let n = new OffscreenCanvas(0, 0);
				if (n.getContext("2d", kr)?.measureText) return e.__canvas = n, n;
				t = y.get().createCanvas();
			} catch {
				t = y.get().createCanvas();
			}
			t.width = t.height = 10, e.__canvas = t;
		}
		return e.__canvas;
	}
	static get _context() {
		return e.__context ||= e._canvas.getContext("2d", kr), e.__context;
	}
};
J.METRICS_STRING = "|ÉqÅ", J.BASELINE_SYMBOL = "M", J.BASELINE_MULTIPLIER = 1.4, J.HEIGHT_MULTIPLIER = 2, J.graphemeSegmenter = (() => {
	if (typeof Intl?.Segmenter == "function") {
		let e = new Intl.Segmenter();
		return (t) => {
			let n = e.segment(t), r = [], i = 0;
			for (let e of n) r[i++] = e.segment;
			return r;
		};
	}
	return (e) => [...e];
})(), J.experimentalLetterSpacing = !1, J._fonts = {}, J._measurementCache = ir(1e3);
var Ar = J, jr = [
	"serif",
	"sans-serif",
	"monospace",
	"cursive",
	"fantasy",
	"system-ui"
];
function Mr(e) {
	let t = typeof e.fontSize == "number" ? `${e.fontSize}px` : e.fontSize, n = e.fontFamily;
	Array.isArray(e.fontFamily) || (n = e.fontFamily.split(","));
	for (let e = n.length - 1; e >= 0; e--) {
		let t = n[e].trim();
		!/([\"\'])[^\'\"]+\1/.test(t) && !jr.includes(t) && (t = `"${t}"`), n[e] = t;
	}
	return `${e.fontStyle} ${e.fontVariant} ${e.fontWeight} ${t} ${n.join(",")}`;
}
//#endregion
//#region node_modules/pixi.js/lib/scene/text/canvas/utils/getCanvasFillStyle.mjs
var Nr = 1e5;
function Pr(e, t, n, r = 0, a = 0, o = 0) {
	if (e.texture === T.WHITE && !e.fill) return E.shared.setValue(e.color).setAlpha(e.alpha ?? 1).toHexa();
	if (!e.fill) {
		let n = t.createPattern(e.texture.source.resource, "repeat"), r = e.matrix.copyTo(i.shared);
		return r.scale(e.texture.source.pixelWidth, e.texture.source.pixelHeight), n.setTransform(r), n;
	} else if (e.fill instanceof Fe) {
		let n = e.fill, r = t.createPattern(n.texture.source.resource, "repeat");
		return P.applyPatternTransform(r, n.transform, !1), r;
	} else if (e.fill instanceof Pe) {
		let i = e.fill, s = i.type === "linear", c = i.textureSpace === "local", l = 1, u = 1;
		c && n && (l = n.width + r, u = n.height + r);
		let d, f = !1;
		if (s) {
			let { start: e, end: n } = i;
			d = t.createLinearGradient(e.x * l + a, e.y * u + o, n.x * l + a, n.y * u + o), f = Math.abs(n.x - e.x) < Math.abs((n.y - e.y) * .1);
		} else {
			let { center: e, innerRadius: n, outerCenter: r, outerRadius: s } = i;
			d = t.createRadialGradient(e.x * l + a, e.y * u + o, n * l, r.x * l + a, r.y * u + o, s * l);
		}
		if (f && c && n) {
			let e = n.lineHeight / u;
			for (let t = 0; t < n.lines.length; t++) {
				let a = (t * n.lineHeight + r / 2) / u;
				i.colorStops.forEach((t) => {
					let n = a + t.offset * e;
					n = Math.max(0, Math.min(1, n)), d.addColorStop(Math.floor(n * Nr) / Nr, E.shared.setValue(t.color).toHex());
				});
			}
		} else i.colorStops.forEach((e) => {
			d.addColorStop(e.offset, E.shared.setValue(e.color).toHex());
		});
		return d;
	}
	return w("FillStyle not recognised", e), "red";
}
//#endregion
//#region node_modules/pixi.js/lib/scene/text/TextStyle.mjs
var Fr = class e extends a {
	constructor(t = {}) {
		super(), this.uid = p("textStyle"), this._tick = 0, this._cachedFontString = null, Lr(t), t instanceof e && (t = t._toObject());
		let n = {
			...e.defaultTextStyle,
			...t
		};
		for (let e in n) {
			let t = e;
			this[t] = n[e];
		}
		this._tagStyles = t.tagStyles ?? void 0, this.update(), this._tick = 0;
	}
	get align() {
		return this._align;
	}
	set align(e) {
		this._align !== e && (this._align = e, this.update());
	}
	get breakWords() {
		return this._breakWords;
	}
	set breakWords(e) {
		this._breakWords !== e && (this._breakWords = e, this.update());
	}
	get dropShadow() {
		return this._dropShadow;
	}
	set dropShadow(t) {
		this._dropShadow !== t && (typeof t == "object" && t ? this._dropShadow = this._createProxy({
			...e.defaultDropShadow,
			...t
		}) : this._dropShadow = t ? this._createProxy({ ...e.defaultDropShadow }) : null, this.update());
	}
	get fontFamily() {
		return this._fontFamily;
	}
	set fontFamily(e) {
		this._fontFamily !== e && (this._fontFamily = e, this.update());
	}
	get fontSize() {
		return this._fontSize;
	}
	set fontSize(e) {
		this._fontSize !== e && (typeof e == "string" ? this._fontSize = parseInt(e, 10) : this._fontSize = e, this.update());
	}
	get fontStyle() {
		return this._fontStyle;
	}
	set fontStyle(e) {
		this._fontStyle !== e && (this._fontStyle = e.toLowerCase(), this.update());
	}
	get fontVariant() {
		return this._fontVariant;
	}
	set fontVariant(e) {
		this._fontVariant !== e && (this._fontVariant = e, this.update());
	}
	get fontWeight() {
		return this._fontWeight;
	}
	set fontWeight(e) {
		this._fontWeight !== e && (this._fontWeight = e, this.update());
	}
	get leading() {
		return this._leading;
	}
	set leading(e) {
		this._leading !== e && (this._leading = e, this.update());
	}
	get letterSpacing() {
		return this._letterSpacing;
	}
	set letterSpacing(e) {
		this._letterSpacing !== e && (this._letterSpacing = e, this.update());
	}
	get lineHeight() {
		return this._lineHeight;
	}
	set lineHeight(e) {
		this._lineHeight !== e && (this._lineHeight = e, this.update());
	}
	get padding() {
		return this._padding;
	}
	set padding(e) {
		this._padding !== e && (this._padding = e, this.update());
	}
	get filters() {
		return this._filters;
	}
	set filters(e) {
		this._filters !== e && (this._filters = Object.freeze(e), this.update());
	}
	get trim() {
		return this._trim;
	}
	set trim(e) {
		this._trim !== e && (this._trim = e, this.update());
	}
	get textBaseline() {
		return this._textBaseline;
	}
	set textBaseline(e) {
		this._textBaseline !== e && (this._textBaseline = e, this.update());
	}
	get whiteSpace() {
		return this._whiteSpace;
	}
	set whiteSpace(e) {
		this._whiteSpace !== e && (this._whiteSpace = e, this.update());
	}
	get wordWrap() {
		return this._wordWrap;
	}
	set wordWrap(e) {
		this._wordWrap !== e && (this._wordWrap = e, this.update());
	}
	get wordWrapWidth() {
		return this._wordWrapWidth;
	}
	set wordWrapWidth(e) {
		this._wordWrapWidth !== e && (this._wordWrapWidth = e, this.update());
	}
	get fill() {
		return this._originalFill;
	}
	set fill(e) {
		e !== this._originalFill && (this._originalFill = e, this._isFillStyle(e) && (this._originalFill = this._createProxy({
			...H.defaultFillStyle,
			...e
		}, () => {
			this._fill = Le({ ...this._originalFill }, H.defaultFillStyle);
		})), this._fill = Le(e === 0 ? "black" : e, H.defaultFillStyle), this.update());
	}
	get stroke() {
		return this._originalStroke;
	}
	set stroke(e) {
		e !== this._originalStroke && (this._originalStroke = e, this._isFillStyle(e) && (this._originalStroke = this._createProxy({
			...H.defaultStrokeStyle,
			...e
		}, () => {
			this._stroke = ze({ ...this._originalStroke }, H.defaultStrokeStyle);
		})), this._stroke = ze(e, H.defaultStrokeStyle), this.update());
	}
	get tagStyles() {
		return this._tagStyles;
	}
	set tagStyles(e) {
		this._tagStyles !== e && (this._tagStyles = e ?? void 0, this.update());
	}
	update() {
		this._tick++, this._cachedFontString = null, this.emit("update", this);
	}
	reset() {
		let t = e.defaultTextStyle;
		for (let e in t) this[e] = t[e];
	}
	assign(e) {
		for (let t in e) {
			let n = t;
			this[n] = e[t];
		}
		return this;
	}
	get styleKey() {
		return `${this.uid}-${this._tick}`;
	}
	get _fontString() {
		return this._cachedFontString === null && (this._cachedFontString = Mr(this)), this._cachedFontString;
	}
	_toObject() {
		return {
			align: this.align,
			breakWords: this.breakWords,
			dropShadow: this._dropShadow ? { ...this._dropShadow } : null,
			fill: this._fill ? { ...this._fill } : void 0,
			fontFamily: this.fontFamily,
			fontSize: this.fontSize,
			fontStyle: this.fontStyle,
			fontVariant: this.fontVariant,
			fontWeight: this.fontWeight,
			leading: this.leading,
			letterSpacing: this.letterSpacing,
			lineHeight: this.lineHeight,
			padding: this.padding,
			stroke: this._stroke ? { ...this._stroke } : void 0,
			textBaseline: this.textBaseline,
			trim: this.trim,
			whiteSpace: this.whiteSpace,
			wordWrap: this.wordWrap,
			wordWrapWidth: this.wordWrapWidth,
			filters: this._filters ? [...this._filters] : void 0,
			tagStyles: this._tagStyles ? { ...this._tagStyles } : void 0
		};
	}
	clone() {
		return new e(this._toObject());
	}
	_getFinalPadding() {
		let e = 0;
		if (this._filters) for (let t = 0; t < this._filters.length; t++) e += this._filters[t].padding;
		return Math.max(this._padding, e);
	}
	destroy(e = !1) {
		if (this.removeAllListeners(), typeof e == "boolean" ? e : e?.texture) {
			let t = typeof e == "boolean" ? e : e?.textureSource;
			this._fill?.texture && this._fill.texture.destroy(t), this._originalFill?.texture && this._originalFill.texture.destroy(t), this._stroke?.texture && this._stroke.texture.destroy(t), this._originalStroke?.texture && this._originalStroke.texture.destroy(t);
		}
		this._fill = null, this._stroke = null, this.dropShadow = null, this._originalStroke = null, this._originalFill = null;
	}
	_createProxy(e, t) {
		return new Proxy(e, { set: (e, n, r) => e[n] === r ? !0 : (e[n] = r, t?.(n, r), this.update(), !0) });
	}
	_isFillStyle(e) {
		return (e ?? null) !== null && !(E.isColorLike(e) || e instanceof Pe || e instanceof Fe);
	}
};
Fr.defaultDropShadow = {
	alpha: 1,
	angle: Math.PI / 6,
	blur: 0,
	color: "black",
	distance: 5
}, Fr.defaultTextStyle = {
	align: "left",
	breakWords: !1,
	dropShadow: null,
	fill: "black",
	fontFamily: "Arial",
	fontSize: 26,
	fontStyle: "normal",
	fontVariant: "normal",
	fontWeight: "normal",
	leading: 0,
	letterSpacing: 0,
	lineHeight: 0,
	padding: 0,
	stroke: null,
	textBaseline: "alphabetic",
	trim: !1,
	whiteSpace: "pre",
	wordWrap: !1,
	wordWrapWidth: 100
};
var Ir = Fr;
function Lr(e) {
	let t = e;
	if (typeof t.dropShadow == "boolean" && t.dropShadow) {
		let n = Ir.defaultDropShadow;
		e.dropShadow = {
			alpha: t.dropShadowAlpha ?? n.alpha,
			angle: t.dropShadowAngle ?? n.angle,
			blur: t.dropShadowBlur ?? n.blur,
			color: t.dropShadowColor ?? n.color,
			distance: t.dropShadowDistance ?? n.distance
		};
	}
	if (t.strokeThickness !== void 0) {
		r(m, "strokeThickness is now a part of stroke");
		let n = t.stroke, i = {};
		if (E.isColorLike(n)) i.color = n;
		else if (n instanceof Pe || n instanceof Fe) i.fill = n;
		else if (Object.hasOwnProperty.call(n, "color") || Object.hasOwnProperty.call(n, "fill")) i = n;
		else throw Error("Invalid stroke value.");
		e.stroke = {
			...i,
			width: t.strokeThickness
		};
	}
	if (Array.isArray(t.fillGradientStops)) {
		if (r(m, "gradient fill is now a fill pattern: `new FillGradient(...)`"), !Array.isArray(t.fill) || t.fill.length === 0) throw Error("Invalid fill value. Expected an array of colors for gradient fill.");
		t.fill.length !== t.fillGradientStops.length && w("The number of fill colors must match the number of fill gradient stops.");
		let n = new Pe({
			start: {
				x: 0,
				y: 0
			},
			end: {
				x: 0,
				y: 1
			},
			textureSpace: "local"
		}), i = t.fillGradientStops.slice(), a = t.fill.map((e) => E.shared.setValue(e).toNumber());
		i.forEach((e, t) => {
			n.addColorStop(e, a[t]);
		}), e.fill = { fill: n };
	}
}
//#endregion
//#region node_modules/pixi.js/lib/scene/text-bitmap/AbstractBitmapFont.mjs
var Rr = class extends a {
	constructor() {
		super(...arguments), this.chars = /* @__PURE__ */ Object.create(null), this.lineHeight = 0, this.fontFamily = "", this.fontMetrics = {
			fontSize: 0,
			ascent: 0,
			descent: 0
		}, this.baseLineOffset = 0, this.distanceField = {
			type: "none",
			range: 0
		}, this.pages = [], this.applyFillAsTint = !0, this.baseMeasurementFontSize = 100, this.baseRenderedFontSize = 100;
	}
	get font() {
		return r(m, "BitmapFont.font is deprecated, please use BitmapFont.fontFamily instead."), this.fontFamily;
	}
	get pageTextures() {
		return r(m, "BitmapFont.pageTextures is deprecated, please use BitmapFont.pages instead."), this.pages;
	}
	get size() {
		return r(m, "BitmapFont.size is deprecated, please use BitmapFont.fontMetrics.fontSize instead."), this.fontMetrics.fontSize;
	}
	get distanceFieldRange() {
		return r(m, "BitmapFont.distanceFieldRange is deprecated, please use BitmapFont.distanceField.range instead."), this.distanceField.range;
	}
	get distanceFieldType() {
		return r(m, "BitmapFont.distanceFieldType is deprecated, please use BitmapFont.distanceField.type instead."), this.distanceField.type;
	}
	destroy(e = !1) {
		this.emit("destroy", this), this.removeAllListeners();
		for (let e in this.chars) this.chars[e].texture?.destroy();
		this.chars = null, e && (this.pages.forEach((e) => e.texture.destroy(!0)), this.pages = null);
	}
}, zr = class e extends Rr {
	constructor(t) {
		super(), this.resolution = 1, this.pages = [], this._padding = 0, this._measureCache = /* @__PURE__ */ Object.create(null), this._currentChars = [], this._currentX = 0, this._currentY = 0, this._currentMaxCharHeight = 0, this._currentPageIndex = -1, this._skipKerning = !1;
		let n = {
			...e.defaultOptions,
			...t
		};
		this._textureSize = n.textureSize, this._mipmap = n.mipmap;
		let r = n.style.clone();
		n.overrideFill && (r._fill.color = 16777215, r._fill.alpha = 1, r._fill.texture = T.WHITE, r._fill.fill = null), this.applyFillAsTint = n.overrideFill;
		let i = r.fontSize;
		r.fontSize = this.baseMeasurementFontSize;
		let a = Mr(r);
		n.overrideSize ? (r._stroke && (r._stroke.width *= this.baseRenderedFontSize / i), r.dropShadow && (r.dropShadow.blur *= this.baseRenderedFontSize / i, r.dropShadow.distance *= this.baseRenderedFontSize / i)) : r.fontSize = this.baseRenderedFontSize = i, this._style = r, this._skipKerning = n.skipKerning ?? !1, this.resolution = n.resolution ?? 1, this._padding = n.padding ?? 4, n.textureStyle && (this._textureStyle = n.textureStyle instanceof o ? n.textureStyle : new o(n.textureStyle)), this.fontMetrics = Ar.measureFont(a), this.lineHeight = r.lineHeight || this.fontMetrics.fontSize || r.fontSize;
	}
	ensureCharacters(e) {
		let n = Ar.graphemeSegmenter(e).filter((e) => !this._currentChars.includes(e)).filter((e, t, n) => n.indexOf(e) === t);
		if (!n.length) return;
		this._currentChars = [...this._currentChars, ...n];
		let r;
		r = this._currentPageIndex === -1 ? this._nextPage() : this.pages[this._currentPageIndex];
		let { canvas: i, context: a } = r.canvasAndContext, o = r.texture.source, s = this._style, c = this._currentX, l = this._currentY, u = this._currentMaxCharHeight, d = this.baseRenderedFontSize / this.baseMeasurementFontSize, f = (s.dropShadow?.distance ?? 0) + (s._stroke?.width ?? 0), p = this._padding + f, m = !1, h = i.width / this.resolution, g = i.height / this.resolution;
		for (let e = 0; e < n.length; e++) {
			let r = n[e], f = Ar.measureText(r, s, i, !1);
			f.lineHeight = f.height;
			let _ = f.width * d, v = Math.ceil((s.fontStyle === "italic" ? 2 : 1) * _), y = f.height * d, b = v + p * 2, x = y + p * 2;
			if (m = !1, r !== "\n" && r !== "\r" && r !== "	" && r !== " " && (m = !0, u = Math.ceil(Math.max(x, u))), c + b > h && (l += u, u = x, c = 0, l + u > g)) {
				o.update();
				let e = this._nextPage();
				i = e.canvasAndContext.canvas, a = e.canvasAndContext.context, o = e.texture.source, c = 0, l = 0, u = 0;
			}
			let S = a.measureText(r).width / d;
			if (this.chars[r] = {
				id: r.codePointAt(0),
				xOffset: -(p / d),
				yOffset: -(p / d),
				xAdvance: S,
				kerning: {}
			}, m) {
				this._drawGlyph(a, f, c + p, l + p, d, s);
				let e = o.width * d, n = o.height * d, i = new t(c / e * o.width, l / n * o.height, b / e * o.width, x / n * o.height);
				this.chars[r].texture = new T({
					source: o,
					frame: i
				}), c += Math.ceil(b);
			}
		}
		o.update(), this._currentX = c, this._currentY = l, this._currentMaxCharHeight = u, this._skipKerning || this._applyKerning(n, a, d);
	}
	get pageTextures() {
		return r(m, "BitmapFont.pageTextures is deprecated, please use BitmapFont.pages instead."), this.pages;
	}
	_applyKerning(e, t, n) {
		let r = this._measureCache;
		for (let i = 0; i < e.length; i++) {
			let a = e[i];
			for (let e = 0; e < this._currentChars.length; e++) {
				let i = this._currentChars[e], o = r[a];
				o ||= r[a] = t.measureText(a).width;
				let s = r[i];
				s ||= r[i] = t.measureText(i).width;
				let c = t.measureText(a + i).width, l = c - (o + s);
				l && this.chars[a] && (this.chars[a].kerning[i] = l / n), c = t.measureText(a + i).width, l = c - (o + s), l && this.chars[i] && (this.chars[i].kerning[a] = l / n);
			}
		}
	}
	_nextPage() {
		this._currentPageIndex++;
		let e = this.resolution, t = Ue.getOptimalCanvasAndContext(this._textureSize, this._textureSize, e);
		this._setupContext(t.context, this._style, e);
		let n = e * (this.baseRenderedFontSize / this.baseMeasurementFontSize), r = new T({ source: new de({
			resource: t.canvas,
			resolution: n,
			alphaMode: "premultiply-alpha-on-upload",
			autoGenerateMipmaps: this._mipmap
		}) });
		this._textureStyle && (r.source.style = this._textureStyle);
		let i = {
			canvasAndContext: t,
			texture: r
		};
		return this.pages[this._currentPageIndex] = i, i;
	}
	_setupContext(e, t, n) {
		t.fontSize = this.baseRenderedFontSize, e.scale(n, n), e.font = Mr(t), t.fontSize = this.baseMeasurementFontSize, e.textBaseline = t.textBaseline;
		let r = t._stroke, i = r?.width ?? 0;
		if (r && (e.lineWidth = i, e.lineJoin = r.join, e.miterLimit = r.miterLimit, e.strokeStyle = Pr(r, e)), t._fill && (e.fillStyle = Pr(t._fill, e)), t.dropShadow) {
			let r = t.dropShadow, i = E.shared.setValue(r.color).toArray(), a = r.blur * n, o = r.distance * n;
			e.shadowColor = `rgba(${i[0] * 255},${i[1] * 255},${i[2] * 255},${r.alpha})`, e.shadowBlur = a, e.shadowOffsetX = Math.cos(r.angle) * o, e.shadowOffsetY = Math.sin(r.angle) * o;
		} else e.shadowColor = "black", e.shadowBlur = 0, e.shadowOffsetX = 0, e.shadowOffsetY = 0;
	}
	_drawGlyph(e, t, n, r, i, a) {
		let o = t.text, s = t.fontProperties, c = (a._stroke?.width ?? 0) * i, l = n + c / 2, u = r - c / 2, d = s.descent * i, f = t.lineHeight * i, p = !1;
		a.stroke && c && (p = !0, e.strokeText(o, l, u + f - d));
		let { shadowBlur: m, shadowOffsetX: h, shadowOffsetY: g } = e;
		a._fill && (p && (e.shadowBlur = 0, e.shadowOffsetX = 0, e.shadowOffsetY = 0), e.fillText(o, l, u + f - d)), p && (e.shadowBlur = m, e.shadowOffsetX = h, e.shadowOffsetY = g);
	}
	destroy() {
		super.destroy();
		for (let e = 0; e < this.pages.length; e++) {
			let { canvasAndContext: t, texture: n } = this.pages[e];
			Ue.returnCanvasAndContext(t), n.destroy(!0);
		}
		this.pages = null;
	}
};
zr.defaultOptions = {
	textureSize: 512,
	style: new Ir(),
	mipmap: !0
};
var Br = zr;
//#endregion
//#region node_modules/pixi.js/lib/scene/text-bitmap/utils/getBitmapTextLayout.mjs
function Vr(e, t, n, r) {
	let i = {
		width: 0,
		height: 0,
		offsetY: 0,
		scale: t.fontSize / n.baseMeasurementFontSize,
		lines: [{
			width: 0,
			charPositions: [],
			spaceWidth: 0,
			spacesIndex: [],
			chars: []
		}]
	};
	i.offsetY = n.baseLineOffset;
	let a = i.lines[0], o = null, s = !0, c = {
		spaceWord: !1,
		width: 0,
		start: 0,
		index: 0,
		positions: [],
		chars: []
	}, l = n.baseMeasurementFontSize / t.fontSize, u = t.letterSpacing * l, d = t.wordWrapWidth * l, f = t.lineHeight ? t.lineHeight * l : n.lineHeight, p = t.wordWrap && t.breakWords, m = vr(t.whiteSpace), h = yr(t.whiteSpace);
	if (m || h) {
		let t = [], n = m;
		for (let r = 0; r < e.length; r++) {
			let i = e[r];
			if (i === "\r" || i === "\n") if (h) i === "\r" && e[r + 1] === "\n" && r++, i = " ";
			else {
				m && (n = !0), t.push(i);
				continue;
			}
			if (K(i)) if (m && gr(i)) {
				if (n) continue;
				n = !0, t.push(" ");
			} else n = !1, t.push(i);
			else n = !1, t.push(i);
		}
		e = t;
	}
	let g = (e) => {
		let t = a.width;
		for (let n = 0; n < c.index; n++) {
			let r = e.positions[n];
			a.chars.push(e.chars[n]), a.charPositions.push(r + t);
		}
		a.width += e.width, (c.index > 0 || !m) && (s = !1), c.width = 0, c.index = 0, c.chars.length = 0;
	}, _ = () => {
		let e = a.chars.length - 1;
		if (r) {
			let t = a.chars[e];
			for (; gr(t);) a.width -= n.chars[t].xAdvance, a.spacesIndex.pop(), t = a.chars[--e];
		}
		i.width = Math.max(i.width, a.width), a = {
			width: 0,
			charPositions: [],
			chars: [],
			spaceWidth: 0,
			spacesIndex: []
		}, s = !0, i.lines.push(a), i.height += f;
	}, v = (e) => e - u > d;
	for (let r = 0; r < e.length + 1; r++) {
		let i, l = r === e.length;
		l || (i = e[r]);
		let d = n.chars[i];
		if (/(?:\s)/.test(i) || i === "\r" || i === "\n" || l) {
			if (!s && t.wordWrap && v(a.width + c.width) ? (_(), g(c), !l && d && a.charPositions.push(0)) : (c.start = a.width, g(c), !l && d && a.charPositions.push(0)), i === "\r" || i === "\n") _();
			else if (!l && d) {
				let e = d.xAdvance + (d.kerning?.[o] || 0) + u;
				a.width += e, a.spaceWidth = e, a.spacesIndex.push(a.charPositions.length), a.chars.push(i);
			}
		} else if (d) {
			let e = d.kerning?.[o] || 0, n = d.xAdvance + e + u;
			p && v(c.width + n) && (s || _(), g(c), _()), c.positions[c.index++] = c.width + e, c.chars.push(i), c.width += n, _r(i) && (!s && t.wordWrap && v(a.width + c.width) && _(), g(c));
		}
		o = i;
	}
	return _(), t.align === "center" ? Hr(i) : t.align === "right" ? Ur(i) : t.align === "justify" && Wr(i), i;
}
function Hr(e) {
	for (let t = 0; t < e.lines.length; t++) {
		let n = e.lines[t], r = e.width / 2 - n.width / 2;
		for (let e = 0; e < n.charPositions.length; e++) n.charPositions[e] += r;
	}
}
function Ur(e) {
	for (let t = 0; t < e.lines.length; t++) {
		let n = e.lines[t], r = e.width - n.width;
		for (let e = 0; e < n.charPositions.length; e++) n.charPositions[e] += r;
	}
}
function Wr(e) {
	let t = e.width;
	for (let n = 0; n < e.lines.length - 2; n++) {
		let r = e.lines[n], i = 0, a = r.spacesIndex[i++], o = 0, s = r.spacesIndex.length, c = (t - r.width) / s;
		for (let e = 0; e < r.charPositions.length; e++) e === a && (a = r.spacesIndex[i++], o += c), r.charPositions[e] += o;
	}
}
//#endregion
//#region node_modules/pixi.js/lib/scene/text-bitmap/utils/resolveCharacters.mjs
function Gr(e) {
	if (e === "") return [];
	typeof e == "string" && (e = [e]);
	let t = [];
	for (let n = 0, r = e.length; n < r; n++) {
		let r = e[n];
		if (Array.isArray(r)) {
			if (r.length !== 2) throw Error(`[BitmapFont]: Invalid character range length, expecting 2 got ${r.length}.`);
			if (r[0].length === 0 || r[1].length === 0) throw Error("[BitmapFont]: Invalid character delimiter.");
			let e = r[0].charCodeAt(0), n = r[1].charCodeAt(0);
			if (n < e) throw Error("[BitmapFont]: Invalid character range.");
			for (let r = e, i = n; r <= i; r++) t.push(String.fromCharCode(r));
		} else t.push(...Array.from(r));
	}
	if (t.length === 0) throw Error("[BitmapFont]: Empty set when resolving characters.");
	return t;
}
//#endregion
//#region node_modules/pixi.js/lib/scene/text-bitmap/BitmapFontManager.mjs
var Kr = 0, qr = new class {
	constructor() {
		this.ALPHA = [
			["a", "z"],
			["A", "Z"],
			" "
		], this.NUMERIC = [["0", "9"]], this.ALPHANUMERIC = [
			["a", "z"],
			["A", "Z"],
			["0", "9"],
			" "
		], this.ASCII = [[" ", "~"]], this.defaultOptions = {
			chars: this.ALPHANUMERIC,
			resolution: 1,
			padding: 4,
			skipKerning: !1,
			textureStyle: null
		}, this.measureCache = ir(1e3);
	}
	getFont(e, t) {
		let n = `${t.fontFamily}-bitmap`, r = !0;
		if (I.has(n)) {
			let t = I.get(n);
			return t.ensureCharacters?.(e), t;
		}
		if (t._fill.fill && !t._stroke ? (n += t._fill.fill.styleKey, r = !1) : (t._stroke || t.dropShadow) && (n = `${t.styleKey}-bitmap`, r = !1), n += `-${t.fontStyle}`, n += `-${t.fontVariant}`, n += `-${t.fontWeight}`, !I.has(n)) {
			let e = Object.create(t);
			e._lineHeight = 0;
			let i = new Br({
				style: e,
				overrideFill: r,
				overrideSize: !0,
				...this.defaultOptions
			});
			Kr++, Kr > 50 && w("BitmapText", `You have dynamically created ${Kr} bitmap fonts, this can be inefficient. Try pre installing your font styles using \`BitmapFont.install({name:"style1", style})\``), i.once("destroy", () => {
				Kr--, I.remove(n);
			}), I.set(n, i);
		}
		let i = I.get(n);
		return i.ensureCharacters?.(e), i;
	}
	getLayout(e, t, n = !0) {
		let r = this.getFont(e, t), i = `${e}-${t.styleKey}-${n}`;
		if (this.measureCache.has(i)) return this.measureCache.get(i);
		let a = Vr(Ar.graphemeSegmenter(e), t, r, n);
		return this.measureCache.set(i, a), a;
	}
	measureText(e, t, n = !0) {
		return this.getLayout(e, t, n);
	}
	install(...e) {
		let t = e[0];
		typeof t == "string" && (t = {
			name: t,
			style: e[1],
			chars: e[2]?.chars,
			resolution: e[2]?.resolution,
			padding: e[2]?.padding,
			skipKerning: e[2]?.skipKerning
		}, r(m, "BitmapFontManager.install(name, style, options) is deprecated, use BitmapFontManager.install({name, style, ...options})"));
		let n = t?.name;
		if (!n) throw Error("[BitmapFontManager] Property `name` is required.");
		t = {
			...this.defaultOptions,
			...t
		};
		let i = t.style, a = i instanceof Ir ? i : new Ir(i), o = new Br({
			style: a,
			overrideFill: t.dynamicFill ?? this._canUseTintForStyle(a),
			skipKerning: t.skipKerning,
			padding: t.padding,
			resolution: t.resolution,
			overrideSize: !1,
			textureStyle: t.textureStyle
		}), s = Gr(t.chars);
		return o.ensureCharacters(s.join("")), I.set(`${n}-bitmap`, o), o.once("destroy", () => I.remove(`${n}-bitmap`)), o;
	}
	uninstall(e) {
		let t = `${e}-bitmap`, n = I.get(t);
		n && n.destroy();
	}
	_canUseTintForStyle(e) {
		return !e._stroke && (!e.dropShadow || e.dropShadow.color === 0) && !e._fill.fill && e._fill.color === 16777215;
	}
}();
//#endregion
//#region node_modules/pixi.js/lib/utils/browser/isSafari.mjs
function Jr() {
	let { userAgent: e } = y.get().getNavigator();
	return /^((?!chrome|android).)*safari/i.test(e);
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/batcher/canvas/CanvasBatchAdaptor.mjs
var Yr = class e {
	static _getPatternRepeat(e, t) {
		let n = e && e !== "clamp-to-edge", r = t && t !== "clamp-to-edge";
		return n && r ? "repeat" : n ? "repeat-x" : r ? "repeat-y" : "no-repeat";
	}
	start(e, t, n) {}
	execute(t, r) {
		let i = r.elements;
		if (!i || !i.length) return;
		let a = t.renderer, o = a.canvasContext, s = o.activeContext;
		for (let t = 0; t < i.length; t++) {
			let c = i[t];
			if (!c.packAsQuad) continue;
			let l = c, u = l.texture, f = u ? P.getCanvasSource(u) : null;
			if (!f) continue;
			let p = u.source.style, m = o.smoothProperty, h = p.scaleMode !== "nearest";
			s[m] !== h && (s[m] = h), o.setBlendMode(r.blendMode);
			let g = a.globalUniforms.globalUniformData?.worldColor ?? 4294967295, _ = l.color, v = (g >>> 24 & 255) / 255, y = (_ >>> 24 & 255) / 255, b = a.filter?.alphaMultiplier ?? 1, x = v * y * b;
			if (x <= 0) continue;
			s.globalAlpha = x;
			let S = g & 16777215, C = ne(d(_ & 16777215, S)), w = u.frame, ee = p.addressModeU ?? p.addressMode, T = p.addressModeV ?? p.addressMode, E = e._getPatternRepeat(ee, T), D = u.source._resolution ?? u.source.resolution ?? 1, O = l.renderable?.renderGroup?.isCachedAsTexture, te = w.x * D, re = w.y * D, k = w.width * D, ie = w.height * D, A = l.bounds, ae = a.renderTarget.renderTarget.isRoot, oe = A.minX, j = A.minY, se = A.maxX - A.minX, ce = A.maxY - A.minY, M = u.rotate, N = u.uvs, le = Math.min(N.x0, N.x1, N.x2, N.x3, N.y0, N.y1, N.y2, N.y3), ue = Math.max(N.x0, N.x1, N.x2, N.x3, N.y0, N.y1, N.y2, N.y3), de = E !== "no-repeat" && (le < 0 || ue > 1), F = M && !(!de && (C !== 16777215 || M));
			F ? (e._tempPatternMatrix.copyFrom(l.transform), n.matrixAppendRotationInv(e._tempPatternMatrix, M, oe, j, se, ce), o.setContextTransform(e._tempPatternMatrix, l.roundPixels === 1, void 0, O && ae)) : o.setContextTransform(l.transform, l.roundPixels === 1, void 0, O && ae);
			let I = se, fe = ce, L = F ? 0 : oe, R = F ? 0 : j;
			if (!F && l.roundPixels === 1 && (L |= 0, R |= 0), de) {
				let t = f, n = C !== 16777215 && !M, r = w.width <= u.source.width && w.height <= u.source.height;
				n && r && (t = P.getTintedCanvas({ texture: u }, C));
				let i = s.createPattern(t, E);
				if (!i) continue;
				let a = I, o = fe;
				if (a === 0 || o === 0) continue;
				let c = 1 / a, l = 1 / o, d = (N.x1 - N.x0) * c, p = (N.y1 - N.y0) * c, m = (N.x3 - N.x0) * l, h = (N.y3 - N.y0) * l, g = N.x0 - d * L - m * R, _ = N.y0 - p * L - h * R, v = u.source.pixelWidth, y = u.source.pixelHeight;
				e._tempPatternMatrix.set(d * v, p * y, m * v, h * y, g * v, _ * y), P.applyPatternTransform(i, e._tempPatternMatrix), s.fillStyle = i, s.fillRect(L, R, I, fe);
			} else {
				let e = C !== 16777215 || M ? P.getTintedCanvas({ texture: u }, C) : f, t = e !== f;
				s.drawImage(e, t ? 0 : te, t ? 0 : re, t ? e.width : k, t ? e.height : ie, L, R, I, fe);
			}
		}
	}
};
Yr._tempPatternMatrix = new i(), Yr.extension = {
	type: [D.CanvasPipesAdaptor],
	name: "batch"
};
var Xr = Yr, Zr = class {
	constructor() {
		this._tempState = k.for2d(), this._didUploadHash = {};
	}
	init(e) {
		e.renderer.runners.contextChange.add(this);
	}
	contextChange() {
		this._didUploadHash = {};
	}
	start(e, t, n) {
		let r = e.renderer, i = this._didUploadHash[n.uid];
		r.shader.bind(n, i), i || (this._didUploadHash[n.uid] = !0), r.shader.updateUniformGroup(r.globalUniforms.uniformGroup), r.geometry.bind(t, n.glProgram);
	}
	execute(e, t) {
		let n = e.renderer;
		this._tempState.blendMode = t.blendMode, n.state.set(this._tempState);
		let r = t.textures.textures;
		for (let e = 0; e < t.textures.count; e++) n.texture.bind(r[e], e);
		n.geometry.draw(t.topology, t.size, t.start);
	}
};
Zr.extension = {
	type: [D.WebGLPipesAdaptor],
	name: "batch"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/batcher/gpu/GpuBatchAdaptor.mjs
var Qr = k.for2d(), $r = class {
	start(e, t, n) {
		let r = e.renderer, i = r.encoder, a = n.gpuProgram;
		this._shader = n, this._geometry = t, i.setGeometry(t, a), Qr.blendMode = "normal", r.pipeline.getPipeline(t, a, Qr);
		let o = r.globalUniforms.bindGroup;
		i.resetBindGroup(1), i.setBindGroup(0, o, a);
	}
	execute(e, t) {
		let n = this._shader.gpuProgram, r = e.renderer, i = r.encoder;
		if (!t.bindGroup) {
			let e = t.textures;
			t.bindGroup = He(e.textures, e.count, r.limits.maxBatchableTextures);
		}
		Qr.blendMode = t.blendMode;
		let a = r.bindGroup.getBindGroup(t.bindGroup, n, 1), o = r.pipeline.getPipeline(this._geometry, n, Qr, t.topology);
		t.bindGroup._touch(r.gc.now, r.tick), i.setPipeline(o), i.renderPassEncoder.setBindGroup(1, a), i.renderPassEncoder.drawIndexed(t.size, 1, t.start);
	}
};
$r.extension = {
	type: [D.WebGPUPipesAdaptor],
	name: "batch"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/mask/color/CanvasColorMaskPipe.mjs
var ei = class {
	constructor(e) {
		this._colorStack = [], this._colorStackIndex = 0, this._currentColor = 0, this._renderer = e;
	}
	buildStart() {
		this._colorStack[0] = 15, this._colorStackIndex = 1, this._currentColor = 15;
	}
	push(e, t, n) {
		this._renderer.renderPipes.batch.break(n);
		let r = this._colorStack;
		r[this._colorStackIndex] = r[this._colorStackIndex - 1] & e.mask;
		let i = this._colorStack[this._colorStackIndex];
		i !== this._currentColor && (this._currentColor = i, n.add({
			renderPipeId: "colorMask",
			colorMask: i,
			canBundle: !1
		})), this._colorStackIndex++;
	}
	pop(e, t, n) {
		this._renderer.renderPipes.batch.break(n);
		let r = this._colorStack;
		this._colorStackIndex--;
		let i = r[this._colorStackIndex - 1];
		i !== this._currentColor && (this._currentColor = i, n.add({
			renderPipeId: "colorMask",
			colorMask: i,
			canBundle: !1
		}));
	}
	execute(e) {}
	destroy() {
		this._renderer = null, this._colorStack = null;
	}
};
ei.extension = {
	type: [D.CanvasPipes],
	name: "colorMask"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/mask/stencil/CanvasStencilMaskPipe.mjs
function ti(e, t, n, r, i, a) {
	a = Math.max(0, Math.min(a, Math.min(r, i) / 2)), e.moveTo(t + a, n), e.lineTo(t + r - a, n), e.quadraticCurveTo(t + r, n, t + r, n + a), e.lineTo(t + r, n + i - a), e.quadraticCurveTo(t + r, n + i, t + r - a, n + i), e.lineTo(t + a, n + i), e.quadraticCurveTo(t, n + i, t, n + i - a), e.lineTo(t, n + a), e.quadraticCurveTo(t, n, t + a, n);
}
function ni(e, t) {
	switch (t.type) {
		case "rectangle": {
			let n = t;
			e.rect(n.x, n.y, n.width, n.height);
			break;
		}
		case "roundedRectangle": {
			let n = t;
			ti(e, n.x, n.y, n.width, n.height, n.radius);
			break;
		}
		case "circle": {
			let n = t;
			e.moveTo(n.x + n.radius, n.y), e.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
			break;
		}
		case "ellipse": {
			let n = t;
			e.ellipse ? (e.moveTo(n.x + n.halfWidth, n.y), e.ellipse(n.x, n.y, n.halfWidth, n.halfHeight, 0, 0, Math.PI * 2)) : (e.save(), e.translate(n.x, n.y), e.scale(n.halfWidth, n.halfHeight), e.moveTo(1, 0), e.arc(0, 0, 1, 0, Math.PI * 2), e.restore());
			break;
		}
		case "triangle": {
			let n = t;
			e.moveTo(n.x, n.y), e.lineTo(n.x2, n.y2), e.lineTo(n.x3, n.y3), e.closePath();
			break;
		}
		default: {
			let n = t, r = n.points;
			if (!r?.length) break;
			e.moveTo(r[0], r[1]);
			for (let t = 2; t < r.length; t += 2) e.lineTo(r[t], r[t + 1]);
			n.closePath && e.closePath();
			break;
		}
	}
}
function ri(e, t, n) {
	let r = [], i = [], a = [];
	if (!Re[t.type]?.build(t, r)) return !1;
	Ie(r, n, !1, t.closePath ?? !0, i, a);
	for (let t = 0; t < a.length; t += 3) {
		let n = a[t] * 2, r = a[t + 1] * 2, o = a[t + 2] * 2;
		e.moveTo(i[n], i[n + 1]), e.lineTo(i[r], i[r + 1]), e.lineTo(i[o], i[o + 1]), e.closePath();
	}
	return !0;
}
function ii(e, t) {
	if (!t?.length) return !1;
	for (let n = 0; n < t.length; n++) {
		let r = t[n];
		if (!r?.shape) continue;
		let i = r.transform, a = i && !i.isIdentity();
		a && (e.save(), e.transform(i.a, i.b, i.c, i.d, i.tx, i.ty)), ni(e, r.shape), a && e.restore();
	}
	return !0;
}
var ai = class {
	constructor(e) {
		this._warnedMaskTypes = /* @__PURE__ */ new Set(), this._canvasMaskStack = [], this._renderer = e;
	}
	push(e, t, n) {
		this._renderer.renderPipes.batch.break(n), n.add({
			renderPipeId: "stencilMask",
			action: "pushMaskBegin",
			mask: e,
			inverse: t._maskOptions.inverse,
			canBundle: !1
		});
	}
	pop(e, t, n) {
		this._renderer.renderPipes.batch.break(n), n.add({
			renderPipeId: "stencilMask",
			action: "popMaskEnd",
			mask: e,
			inverse: t._maskOptions.inverse,
			canBundle: !1
		});
	}
	execute(e) {
		if (e.action !== "pushMaskBegin" && e.action !== "popMaskEnd") return;
		let t = this._renderer, n = t.canvasContext, r = n?.activeContext;
		if (!r) return;
		if (e.action === "popMaskEnd") {
			this._canvasMaskStack.pop() && r.restore();
			return;
		}
		e.inverse && this._warnOnce("inverse", "CanvasRenderer: inverse masks are not supported on Canvas2D; ignoring inverse flag.");
		let i = e.mask.mask;
		if (!(i instanceof nr)) {
			this._warnOnce("nonGraphics", "CanvasRenderer: only Graphics masks are supported in Canvas2D; skipping mask."), this._canvasMaskStack.push(!1);
			return;
		}
		let a = i, o = a.context?.instructions;
		if (!o?.length) {
			this._canvasMaskStack.push(!1);
			return;
		}
		r.save(), n.setContextTransform(a.groupTransform, (t._roundPixels | a._roundPixels) === 1), r.beginPath();
		let s = !1, c = !1;
		for (let e = 0; e < o.length; e++) {
			let t = o[e], n = t.action;
			if (n !== "fill" && n !== "stroke") continue;
			let i = t.data, a = i?.path?.shapePath;
			if (!a?.shapePrimitives?.length) continue;
			let l = n === "stroke", u = a.shapePrimitives;
			for (let e = 0; e < u.length; e++) {
				let t = u[e];
				if (!t?.shape) continue;
				let n = t.transform, a = n && !n.isIdentity();
				a && (r.save(), r.transform(n.a, n.b, n.c, n.d, n.tx, n.ty)), l && i.style ? s = ri(r, t.shape, i.style) || s : (ni(r, t.shape), c = ii(r, t.holes) || c, s = !0), a && r.restore();
			}
		}
		if (!s) {
			r.restore(), this._canvasMaskStack.push(!1);
			return;
		}
		c ? r.clip("evenodd") : r.clip(), this._canvasMaskStack.push(!0);
	}
	destroy() {
		this._renderer = null, this._warnedMaskTypes = null, this._canvasMaskStack = null;
	}
	_warnOnce(e, t) {
		this._warnedMaskTypes.has(e) || (this._warnedMaskTypes.add(e), w(t));
	}
};
ai.extension = {
	type: [D.CanvasPipes],
	name: "stencilMask"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/canvas/utils/mapCanvasBlendModesToPixi.mjs
var Y = "source-over";
function oi() {
	let e = ue(), t = /* @__PURE__ */ Object.create(null);
	return t.inherit = Y, t.none = Y, t.normal = "source-over", t.add = "lighter", t.multiply = e ? "multiply" : Y, t.screen = e ? "screen" : Y, t.overlay = e ? "overlay" : Y, t.darken = e ? "darken" : Y, t.lighten = e ? "lighten" : Y, t["color-dodge"] = e ? "color-dodge" : Y, t["color-burn"] = e ? "color-burn" : Y, t["hard-light"] = e ? "hard-light" : Y, t["soft-light"] = e ? "soft-light" : Y, t.difference = e ? "difference" : Y, t.exclusion = e ? "exclusion" : Y, t.saturation = e ? "saturation" : Y, t.color = e ? "color" : Y, t.luminosity = e ? "luminosity" : Y, t["linear-burn"] = e ? "color-burn" : Y, t["linear-dodge"] = e ? "color-dodge" : Y, t["linear-light"] = e ? "hard-light" : Y, t["pin-light"] = e ? "hard-light" : Y, t["vivid-light"] = e ? "hard-light" : Y, t["hard-mix"] = Y, t.negation = e ? "difference" : Y, t["normal-npm"] = t.normal, t["add-npm"] = t.add, t["screen-npm"] = t.screen, t.erase = "destination-out", t.subtract = Y, t.divide = Y, t.min = Y, t.max = Y, t;
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/canvas/CanvasContextSystem.mjs
var si = new i(), ci = class {
	constructor(e) {
		this.activeResolution = 1, this.smoothProperty = "imageSmoothingEnabled", this.blendModes = oi(), this._activeBlendMode = "normal", this._projTransform = null, this._outerBlend = !1, this._warnedBlendModes = /* @__PURE__ */ new Set(), this._renderer = e;
	}
	resolutionChange(e) {
		this.activeResolution = e;
	}
	init() {
		let e = this._renderer.background.alpha < 1;
		if (this.rootContext = this._renderer.canvas.getContext("2d", { alpha: e }), this.activeContext = this.rootContext, this.activeResolution = this._renderer.resolution, !this.rootContext.imageSmoothingEnabled) {
			let e = this.rootContext;
			e.webkitImageSmoothingEnabled ? this.smoothProperty = "webkitImageSmoothingEnabled" : e.mozImageSmoothingEnabled ? this.smoothProperty = "mozImageSmoothingEnabled" : e.oImageSmoothingEnabled ? this.smoothProperty = "oImageSmoothingEnabled" : e.msImageSmoothingEnabled && (this.smoothProperty = "msImageSmoothingEnabled");
		}
	}
	setContextTransform(e, t, n, r) {
		let a = r ? i.IDENTITY : this._renderer.globalUniforms.globalUniformData?.worldTransformMatrix || i.IDENTITY, o = si;
		o.copyFrom(a), o.append(e);
		let s = this._projTransform, c = this.activeResolution;
		if (n ||= c, s) {
			let e = i.shared;
			e.copyFrom(o), e.prepend(s), o = e;
		}
		t ? this.activeContext.setTransform(o.a * n, o.b * n, o.c * n, o.d * n, o.tx * c | 0, o.ty * c | 0) : this.activeContext.setTransform(o.a * n, o.b * n, o.c * n, o.d * n, o.tx * c, o.ty * c);
	}
	clear(e, t) {
		let n = this.activeContext, r = this._renderer;
		if (n.clearRect(0, 0, r.width, r.height), e) {
			let i = E.shared.setValue(e);
			n.globalAlpha = t ?? i.alpha, n.fillStyle = i.toHex(), n.fillRect(0, 0, r.width, r.height), n.globalAlpha = 1;
		}
	}
	setBlendMode(e) {
		if (this._activeBlendMode === e) return;
		this._activeBlendMode = e, this._outerBlend = !1;
		let t = this.blendModes[e];
		if (!t) {
			this._warnedBlendModes.has(e) || (console.warn(`CanvasRenderer: blend mode "${e}" is not supported in Canvas2D; falling back to "source-over".`), this._warnedBlendModes.add(e)), this.activeContext.globalCompositeOperation = "source-over";
			return;
		}
		this.activeContext.globalCompositeOperation = t;
	}
	destroy() {
		this.rootContext = null, this.activeContext = null, this._warnedBlendModes.clear();
	}
};
ci.extension = {
	type: [D.CanvasSystem],
	name: "canvasContext"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/canvas/CanvasLimitsSystem.mjs
var li = class {
	constructor() {
		this.maxTextures = 16, this.maxBatchableTextures = 16, this.maxUniformBindings = 0;
	}
	init() {}
};
li.extension = {
	type: [D.CanvasSystem],
	name: "limits"
};
//#endregion
//#region node_modules/pixi.js/lib/scene/graphics/canvas/CanvasGraphicsAdaptor.mjs
var ui = "#808080", di = new i(), fi = new i(), pi = new i(), mi = new i();
function hi(e, t, n) {
	e.beginPath();
	for (let r = 0; r < n.length; r += 3) {
		let i = n[r] * 2, a = n[r + 1] * 2, o = n[r + 2] * 2;
		e.moveTo(t[i], t[i + 1]), e.lineTo(t[a], t[a + 1]), e.lineTo(t[o], t[o + 1]), e.closePath();
	}
	e.fill();
}
function gi(e) {
	return `#${(e & 16777215).toString(16).padStart(6, "0")}`;
}
function _i(e, t, n, r, i, a) {
	a = Math.max(0, Math.min(a, Math.min(r, i) / 2)), e.moveTo(t + a, n), e.lineTo(t + r - a, n), e.quadraticCurveTo(t + r, n, t + r, n + a), e.lineTo(t + r, n + i - a), e.quadraticCurveTo(t + r, n + i, t + r - a, n + i), e.lineTo(t + a, n + i), e.quadraticCurveTo(t, n + i, t, n + i - a), e.lineTo(t, n + a), e.quadraticCurveTo(t, n, t + a, n);
}
function vi(e, t) {
	switch (t.type) {
		case "rectangle": {
			let n = t;
			e.rect(n.x, n.y, n.width, n.height);
			break;
		}
		case "roundedRectangle": {
			let n = t;
			_i(e, n.x, n.y, n.width, n.height, n.radius);
			break;
		}
		case "circle": {
			let n = t;
			e.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
			break;
		}
		case "ellipse": {
			let n = t;
			e.ellipse ? e.ellipse(n.x, n.y, n.halfWidth, n.halfHeight, 0, 0, Math.PI * 2) : (e.save(), e.translate(n.x, n.y), e.scale(n.halfWidth, n.halfHeight), e.arc(0, 0, 1, 0, Math.PI * 2), e.restore());
			break;
		}
		case "triangle": {
			let n = t;
			e.moveTo(n.x, n.y), e.lineTo(n.x2, n.y2), e.lineTo(n.x3, n.y3), e.closePath();
			break;
		}
		default: {
			let n = t, r = n.points;
			if (!r?.length) break;
			e.moveTo(r[0], r[1]);
			for (let t = 2; t < r.length; t += 2) e.lineTo(r[t], r[t + 1]);
			n.closePath && e.closePath();
			break;
		}
	}
}
function yi(e, t) {
	if (!t?.length) return !1;
	for (let n = 0; n < t.length; n++) {
		let r = t[n];
		if (!r?.shape) continue;
		let i = r.transform, a = i && !i.isIdentity();
		a && (e.save(), e.transform(i.a, i.b, i.c, i.d, i.tx, i.ty)), vi(e, r.shape), a && e.restore();
	}
	return !0;
}
function bi(e, t, n, r) {
	let i = e.fill;
	if (i instanceof Pe) {
		i.buildGradient();
		let a = i.texture;
		if (a) {
			let o = P.getTintedPattern(a, t), s = n ? mi.copyFrom(n).scale(a.source.pixelWidth, a.source.pixelHeight) : mi.copyFrom(i.transform);
			return r && !e.textureSpace && s.append(r), P.applyPatternTransform(o, s), o;
		}
	}
	if (i instanceof Fe) {
		let e = P.getTintedPattern(i.texture, t);
		return P.applyPatternTransform(e, i.transform, !1), e;
	}
	let a = e.texture;
	if (a && a !== T.WHITE) {
		if (!a.source.resource) return ui;
		let r = P.getTintedPattern(a, t), i = n ? mi.copyFrom(n).scale(a.source.pixelWidth, a.source.pixelHeight) : e.matrix;
		return P.applyPatternTransform(r, i), r;
	}
	return gi(t);
}
var xi = class {
	constructor() {
		this.shader = null;
	}
	contextChange(e) {}
	execute(e, t) {
		let r = e.renderer, i = r.canvasContext, a = i.activeContext, o = t.groupTransform, s = r.globalUniforms.globalUniformData?.worldColor ?? 4294967295, c = t.groupColorAlpha, l = (s >>> 24 & 255) / 255, u = (c >>> 24 & 255) / 255, f = r.filter?.alphaMultiplier ?? 1, p = l * u * f;
		if (p <= 0) return;
		let m = s & 16777215, h = ne(d(c & 16777215, m)), g = r._roundPixels | t._roundPixels;
		a.save(), i.setContextTransform(o, g === 1), i.setBlendMode(t.groupBlendMode);
		let _ = t.context.instructions;
		for (let e = 0; e < _.length; e++) {
			let t = _[e];
			if (t.action === "texture") {
				let e = t.data, r = e.image, s = r ? P.getCanvasSource(r) : null;
				if (!s) continue;
				let c = e.alpha * p;
				if (c <= 0) continue;
				let l = d(e.style, h);
				a.globalAlpha = c;
				let u = s;
				l !== 16777215 && (u = P.getTintedCanvas({ texture: r }, l));
				let f = r.frame, m = r.source._resolution ?? r.source.resolution ?? 1, _ = f.x * m, v = f.y * m, y = f.width * m, b = f.height * m;
				u !== s && (_ = 0, v = 0);
				let x = e.transform, S = x && !x.isIdentity(), C = r.rotate;
				S || C ? (di.copyFrom(o), S && di.append(x), C && n.matrixAppendRotationInv(di, C, e.dx, e.dy, e.dw, e.dh), i.setContextTransform(di, g === 1)) : i.setContextTransform(o, g === 1), a.drawImage(u, _, v, u === s ? y : u.width, u === s ? b : u.height, C ? 0 : e.dx, C ? 0 : e.dy, e.dw, e.dh), (S || C) && i.setContextTransform(o, g === 1);
				continue;
			}
			let r = t.data, s = r?.path?.shapePath;
			if (!s?.shapePrimitives?.length) continue;
			let c = r.style, l = d(c.color, h), u = c.alpha * p;
			if (u <= 0) continue;
			let f = t.action === "stroke";
			if (a.globalAlpha = u, f) {
				let e = c;
				a.lineWidth = e.width, a.lineCap = e.cap, a.lineJoin = e.join, a.miterLimit = e.miterLimit;
			}
			let m = s.shapePrimitives;
			if (!f && r.hole?.shapePath?.shapePrimitives?.length) {
				let e = m[m.length - 1];
				e.holes = r.hole.shapePath.shapePrimitives;
			}
			for (let e = 0; e < m.length; e++) {
				let t = m[e];
				if (!t?.shape) continue;
				let n = t.transform, r = n && !n.isIdentity(), i = c.texture && c.texture !== T.WHITE, s = c.textureSpace === "global" ? n : null, u = bi(c, l, i ? Be(fi, c, t.shape, s) : null, r ? pi.copyFrom(o).append(n) : o);
				if (r && (a.save(), a.transform(n.a, n.b, n.c, n.d, n.tx, n.ty)), f) {
					let e = c;
					if (e.alignment !== .5 && !e.pixelLine) {
						let n = [], r = [], i = [];
						Re[t.shape.type]?.build(t.shape, n) ? (Ie(n, e, !1, t.shape.closePath ?? !0, r, i), a.fillStyle = u, hi(a, r, i)) : (a.strokeStyle = u, a.beginPath(), vi(a, t.shape), a.stroke());
					} else a.strokeStyle = u, a.beginPath(), vi(a, t.shape), a.stroke();
				} else a.fillStyle = u, a.beginPath(), vi(a, t.shape), yi(a, t.holes) ? a.fill("evenodd") : a.fill();
				r && a.restore();
			}
		}
		a.restore();
	}
	destroy() {
		this.shader = null;
	}
};
xi.extension = {
	type: [D.CanvasPipesAdaptor],
	name: "graphics"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/canvas/renderTarget/CanvasRenderTargetAdaptor.mjs
var Si = class {
	init(e, t) {
		this._renderer = e, this._renderTargetSystem = t;
	}
	initGpuRenderTarget(e) {
		let t = e.colorTexture, { canvas: n, context: r } = this._ensureCanvas(t);
		return {
			canvas: n,
			context: r,
			width: n.width,
			height: n.height
		};
	}
	resizeGpuRenderTarget(e) {
		let t = e.colorTexture, { canvas: n } = this._ensureCanvas(t);
		n.width = e.pixelWidth, n.height = e.pixelHeight;
	}
	startRenderPass(e, t, n, r) {
		let i = this._renderTargetSystem.getGpuRenderTarget(e);
		this._renderer.canvasContext.activeContext = i.context, this._renderer.canvasContext.activeResolution = e.resolution, t && this.clear(e, t, n, r);
	}
	clear(e, t, n, r) {
		let i = this._renderTargetSystem.getGpuRenderTarget(e).context, a = r || {
			x: 0,
			y: 0,
			width: e.pixelWidth,
			height: e.pixelHeight
		};
		if (i.setTransform(1, 0, 0, 1, 0, 0), i.clearRect(a.x, a.y, a.width, a.height), n) {
			let e = E.shared.setValue(n);
			e.alpha > 0 && (i.globalAlpha = e.alpha, i.fillStyle = e.toHex(), i.fillRect(a.x, a.y, a.width, a.height), i.globalAlpha = 1);
		}
	}
	finishRenderPass() {}
	copyToTexture(e, t, n, r, i) {
		let a = this._renderTargetSystem.getGpuRenderTarget(e).canvas, o = t.source, { context: s } = this._ensureCanvas(o), c = i?.x ?? 0, l = i?.y ?? 0;
		return s.drawImage(a, n.x, n.y, r.width, r.height, c, l, r.width, r.height), o.update(), t;
	}
	destroyGpuRenderTarget(e) {}
	_ensureCanvas(e) {
		let t = e.resource;
		(!t || !O.test(t)) && (t = y.get().createCanvas(e.pixelWidth, e.pixelHeight), e.resource = t), (t.width !== e.pixelWidth || t.height !== e.pixelHeight) && (t.width = e.pixelWidth, t.height = e.pixelHeight);
		let n = t.getContext("2d");
		return {
			canvas: t,
			context: n
		};
	}
}, Ci = class extends be {
	constructor(e) {
		super(e), this.adaptor = new Si(), this.adaptor.init(e, this);
	}
};
Ci.extension = {
	type: [D.CanvasSystem],
	name: "renderTarget"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/canvas/texture/CanvasTextureSystem.mjs
var wi = class {
	constructor(e) {}
	init() {}
	initSource(e) {}
	generateCanvas(e) {
		let t = y.get().createCanvas(), n = t.getContext("2d"), r = P.getCanvasSource(e);
		if (!r) return t;
		let i = e.frame, a = e.source._resolution ?? e.source.resolution ?? 1, o = i.x * a, s = i.y * a, c = i.width * a, l = i.height * a;
		return t.width = Math.ceil(c), t.height = Math.ceil(l), n.drawImage(r, o, s, c, l, 0, 0, c, l), t;
	}
	getPixels(e) {
		let t = this.generateCanvas(e);
		return {
			pixels: t.getContext("2d", { willReadFrequently: !0 }).getImageData(0, 0, t.width, t.height).data,
			width: t.width,
			height: t.height
		};
	}
	destroy() {}
};
wi.extension = {
	type: [D.CanvasSystem],
	name: "texture"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/canvas/CanvasRenderer.mjs
var Ti = /* @__PURE__ */ s({ CanvasRenderer: () => Mi }), Ei = [
	...ve,
	ci,
	li,
	wi,
	Ci
], Di = [
	me,
	he,
	fe,
	_e,
	L,
	ai,
	ei,
	ye
], Oi = [Xr, xi], ki = [], Ai = [], ji = [];
e.handleByNamedList(D.CanvasSystem, ki), e.handleByNamedList(D.CanvasPipes, Ai), e.handleByNamedList(D.CanvasPipesAdaptor, ji), e.add(...Ei, ...Di, ...Oi);
var Mi = class extends pe {
	constructor() {
		let e = {
			name: "canvas",
			type: c.CANVAS,
			systems: ki,
			renderPipes: Ai,
			renderPipeAdaptors: ji
		};
		super(e);
	}
}, Ni = /* @__PURE__ */ ((e) => (e[e.ELEMENT_ARRAY_BUFFER = 34963] = "ELEMENT_ARRAY_BUFFER", e[e.ARRAY_BUFFER = 34962] = "ARRAY_BUFFER", e[e.UNIFORM_BUFFER = 35345] = "UNIFORM_BUFFER", e))(Ni || {}), Pi = class {
	constructor(e, t) {
		this._lastBindBaseLocation = -1, this._lastBindCallId = -1, this.buffer = e || null, this.updateID = -1, this.byteLength = -1, this.type = t;
	}
	destroy() {
		this.buffer = null, this.updateID = -1, this.byteLength = -1, this.type = -1, this._lastBindBaseLocation = -1, this._lastBindCallId = -1;
	}
}, Fi = class {
	constructor(e) {
		this._boundBufferBases = /* @__PURE__ */ Object.create(null), this._minBaseLocation = 0, this._nextBindBaseIndex = this._minBaseLocation, this._bindCallId = 0, this._renderer = e, this._managedBuffers = new V({
			renderer: e,
			type: "resource",
			onUnload: this.onBufferUnload.bind(this),
			name: "glBuffer"
		});
	}
	destroy() {
		this._managedBuffers.destroy(), this._renderer = null, this._gl = null, this._boundBufferBases = {};
	}
	contextChange() {
		this._gl = this._renderer.gl, this.destroyAll(!0), this._maxBindings = this._renderer.limits.maxUniformBindings;
	}
	getGlBuffer(e) {
		return e._gcLastUsed = this._renderer.gc.now, e._gpuData[this._renderer.uid] || this.createGLBuffer(e);
	}
	bind(e) {
		let { _gl: t } = this, n = this.getGlBuffer(e);
		t.bindBuffer(n.type, n.buffer);
	}
	bindBufferBase(e, t) {
		let { _gl: n } = this;
		this._boundBufferBases[t] !== e && (this._boundBufferBases[t] = e, e._lastBindBaseLocation = t, n.bindBufferBase(n.UNIFORM_BUFFER, t, e.buffer));
	}
	nextBindBase(e) {
		this._bindCallId++, this._minBaseLocation = 0, e && (this._boundBufferBases[0] = null, this._minBaseLocation = 1, this._nextBindBaseIndex < 1 && (this._nextBindBaseIndex = 1));
	}
	freeLocationForBufferBase(e) {
		let t = this.getLastBindBaseLocation(e);
		if (t >= this._minBaseLocation) return e._lastBindCallId = this._bindCallId, t;
		let n = 0, r = this._nextBindBaseIndex;
		for (; n < 2;) {
			r >= this._maxBindings && (r = this._minBaseLocation, n++);
			let e = this._boundBufferBases[r];
			if (e && e._lastBindCallId === this._bindCallId) {
				r++;
				continue;
			}
			break;
		}
		return t = r, this._nextBindBaseIndex = r + 1, n >= 2 ? -1 : (e._lastBindCallId = this._bindCallId, this._boundBufferBases[t] = null, t);
	}
	getLastBindBaseLocation(e) {
		let t = e._lastBindBaseLocation;
		return this._boundBufferBases[t] === e ? t : -1;
	}
	bindBufferRange(e, t, n, r) {
		let { _gl: i } = this;
		n ||= 0, t ||= 0, this._boundBufferBases[t] = null, i.bindBufferRange(i.UNIFORM_BUFFER, t || 0, e.buffer, n * 256, r || 256);
	}
	updateBuffer(e) {
		let { _gl: t } = this, n = this.getGlBuffer(e);
		if (e._updateID === n.updateID) return n;
		n.updateID = e._updateID, t.bindBuffer(n.type, n.buffer);
		let r = e.data, i = e.descriptor.usage & b.STATIC ? t.STATIC_DRAW : t.DYNAMIC_DRAW;
		return r ? n.byteLength >= r.byteLength ? t.bufferSubData(n.type, 0, r, 0, e._updateSize / r.BYTES_PER_ELEMENT) : (n.byteLength = r.byteLength, t.bufferData(n.type, r, i)) : (n.byteLength = e.descriptor.size, t.bufferData(n.type, n.byteLength, i)), n;
	}
	destroyAll(e = !1) {
		this._managedBuffers.removeAll(e);
	}
	onBufferUnload(e, t = !1) {
		let n = e._gpuData[this._renderer.uid];
		n && (t || this._gl.deleteBuffer(n.buffer));
	}
	createGLBuffer(e) {
		let { _gl: t } = this, n = Ni.ARRAY_BUFFER;
		e.descriptor.usage & b.INDEX ? n = Ni.ELEMENT_ARRAY_BUFFER : e.descriptor.usage & b.UNIFORM && (n = Ni.UNIFORM_BUFFER);
		let r = new Pi(t.createBuffer(), n);
		return e._gpuData[this._renderer.uid] = r, this._managedBuffers.add(e), r;
	}
	resetState() {
		this._boundBufferBases = /* @__PURE__ */ Object.create(null);
	}
};
Fi.extension = {
	type: [D.WebGLSystem],
	name: "buffer"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/context/GlContextSystem.mjs
var Ii = class e {
	constructor(e) {
		this.supports = {
			uint32Indices: !0,
			uniformBufferObject: !0,
			vertexArrayObject: !0,
			srgbTextures: !0,
			nonPowOf2wrapping: !0,
			msaa: !0,
			nonPowOf2mipmaps: !0
		}, this._renderer = e, this.extensions = /* @__PURE__ */ Object.create(null), this.handleContextLost = this.handleContextLost.bind(this), this.handleContextRestored = this.handleContextRestored.bind(this);
	}
	get isLost() {
		return !this.gl || this.gl.isContextLost();
	}
	contextChange(e) {
		this.gl = e, this._renderer.gl = e;
	}
	init(t) {
		t = {
			...e.defaultOptions,
			...t
		};
		let n = this.multiView = t.multiView;
		if (t.context && n && (w("Renderer created with both a context and multiview enabled. Disabling multiView as both cannot work together."), n = !1), n ? this.canvas = y.get().createCanvas(this._renderer.canvas.width, this._renderer.canvas.height) : this.canvas = this._renderer.view.canvas, t.context) this.initFromContext(t.context);
		else {
			let e = this._renderer.background.alpha < 1, n = t.premultipliedAlpha ?? !0, r = t.antialias && !this._renderer.backBuffer.useBackBuffer;
			this.createContext(t.preferWebGLVersion, {
				alpha: e,
				premultipliedAlpha: n,
				antialias: r,
				stencil: !0,
				preserveDrawingBuffer: t.preserveDrawingBuffer,
				powerPreference: t.powerPreference ?? "default"
			});
		}
	}
	ensureCanvasSize(e) {
		if (!this.multiView) {
			e !== this.canvas && w("multiView is disabled, but targetCanvas is not the main canvas");
			return;
		}
		let { canvas: t } = this;
		(t.width < e.width || t.height < e.height) && (t.width = Math.max(e.width, e.width), t.height = Math.max(e.height, e.height));
	}
	initFromContext(e) {
		this.gl = e, this.webGLVersion = e instanceof y.get().getWebGLRenderingContext() ? 1 : 2, this.getExtensions(), this.validateContext(e), this._renderer.runners.contextChange.emit(e);
		let t = this._renderer.view.canvas;
		t.addEventListener("webglcontextlost", this.handleContextLost, !1), t.addEventListener("webglcontextrestored", this.handleContextRestored, !1);
	}
	createContext(e, t) {
		let n, r = this.canvas;
		if (e === 2 && (n = r.getContext("webgl2", t)), !n && (n = r.getContext("webgl", t), !n)) throw Error("This browser does not support WebGL. Try using the canvas renderer");
		this.gl = n, this.initFromContext(this.gl);
	}
	getExtensions() {
		let { gl: e } = this, t = {
			anisotropicFiltering: e.getExtension("EXT_texture_filter_anisotropic"),
			floatTextureLinear: e.getExtension("OES_texture_float_linear"),
			s3tc: e.getExtension("WEBGL_compressed_texture_s3tc"),
			s3tc_sRGB: e.getExtension("WEBGL_compressed_texture_s3tc_srgb"),
			etc: e.getExtension("WEBGL_compressed_texture_etc"),
			etc1: e.getExtension("WEBGL_compressed_texture_etc1"),
			pvrtc: e.getExtension("WEBGL_compressed_texture_pvrtc") || e.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc"),
			atc: e.getExtension("WEBGL_compressed_texture_atc"),
			astc: e.getExtension("WEBGL_compressed_texture_astc"),
			bptc: e.getExtension("EXT_texture_compression_bptc"),
			rgtc: e.getExtension("EXT_texture_compression_rgtc"),
			loseContext: e.getExtension("WEBGL_lose_context")
		};
		if (this.webGLVersion === 1) this.extensions = {
			...t,
			drawBuffers: e.getExtension("WEBGL_draw_buffers"),
			depthTexture: e.getExtension("WEBGL_depth_texture"),
			vertexArrayObject: e.getExtension("OES_vertex_array_object") || e.getExtension("MOZ_OES_vertex_array_object") || e.getExtension("WEBKIT_OES_vertex_array_object"),
			uint32ElementIndex: e.getExtension("OES_element_index_uint"),
			floatTexture: e.getExtension("OES_texture_float"),
			floatTextureLinear: e.getExtension("OES_texture_float_linear"),
			textureHalfFloat: e.getExtension("OES_texture_half_float"),
			textureHalfFloatLinear: e.getExtension("OES_texture_half_float_linear"),
			vertexAttribDivisorANGLE: e.getExtension("ANGLE_instanced_arrays"),
			srgb: e.getExtension("EXT_sRGB")
		};
		else {
			this.extensions = {
				...t,
				colorBufferFloat: e.getExtension("EXT_color_buffer_float")
			};
			let n = e.getExtension("WEBGL_provoking_vertex");
			n && n.provokingVertexWEBGL(n.FIRST_VERTEX_CONVENTION_WEBGL);
		}
	}
	handleContextLost(e) {
		e.preventDefault(), this._contextLossForced && (this._contextLossForced = !1, setTimeout(() => {
			this.gl.isContextLost() && this.extensions.loseContext?.restoreContext();
		}, 0));
	}
	handleContextRestored() {
		this.getExtensions(), this._renderer.runners.contextChange.emit(this.gl);
	}
	destroy() {
		let e = this._renderer.view.canvas;
		this._renderer = null, e.removeEventListener("webglcontextlost", this.handleContextLost), e.removeEventListener("webglcontextrestored", this.handleContextRestored), this.gl.useProgram(null), this.extensions.loseContext?.loseContext();
	}
	forceContextLoss() {
		this.extensions.loseContext?.loseContext(), this._contextLossForced = !0;
	}
	validateContext(e) {
		let t = e.getContextAttributes();
		t && !t.stencil && w("Provided WebGL context does not have a stencil buffer, masks may not render correctly");
		let n = this.supports, r = this.webGLVersion === 2, i = this.extensions;
		n.uint32Indices = r || !!i.uint32ElementIndex, n.uniformBufferObject = r, n.vertexArrayObject = r || !!i.vertexArrayObject, n.srgbTextures = r || !!i.srgb, n.nonPowOf2wrapping = r, n.nonPowOf2mipmaps = r, n.msaa = r, n.uint32Indices || w("Provided WebGL context does not support 32 index buffer, large scenes may not render correctly");
	}
};
Ii.extension = {
	type: [D.WebGLSystem],
	name: "context"
}, Ii.defaultOptions = {
	context: null,
	premultipliedAlpha: !0,
	preserveDrawingBuffer: !1,
	powerPreference: void 0,
	preferWebGLVersion: 2,
	multiView: !1
};
var Li = Ii, Ri = /* @__PURE__ */ ((e) => (e[e.RGBA = 6408] = "RGBA", e[e.RGB = 6407] = "RGB", e[e.RG = 33319] = "RG", e[e.RED = 6403] = "RED", e[e.RGBA_INTEGER = 36249] = "RGBA_INTEGER", e[e.RGB_INTEGER = 36248] = "RGB_INTEGER", e[e.RG_INTEGER = 33320] = "RG_INTEGER", e[e.RED_INTEGER = 36244] = "RED_INTEGER", e[e.ALPHA = 6406] = "ALPHA", e[e.LUMINANCE = 6409] = "LUMINANCE", e[e.LUMINANCE_ALPHA = 6410] = "LUMINANCE_ALPHA", e[e.DEPTH_COMPONENT = 6402] = "DEPTH_COMPONENT", e[e.DEPTH_STENCIL = 34041] = "DEPTH_STENCIL", e))(Ri || {}), zi = /* @__PURE__ */ ((e) => (e[e.TEXTURE_2D = 3553] = "TEXTURE_2D", e[e.TEXTURE_CUBE_MAP = 34067] = "TEXTURE_CUBE_MAP", e[e.TEXTURE_2D_ARRAY = 35866] = "TEXTURE_2D_ARRAY", e[e.TEXTURE_CUBE_MAP_POSITIVE_X = 34069] = "TEXTURE_CUBE_MAP_POSITIVE_X", e[e.TEXTURE_CUBE_MAP_NEGATIVE_X = 34070] = "TEXTURE_CUBE_MAP_NEGATIVE_X", e[e.TEXTURE_CUBE_MAP_POSITIVE_Y = 34071] = "TEXTURE_CUBE_MAP_POSITIVE_Y", e[e.TEXTURE_CUBE_MAP_NEGATIVE_Y = 34072] = "TEXTURE_CUBE_MAP_NEGATIVE_Y", e[e.TEXTURE_CUBE_MAP_POSITIVE_Z = 34073] = "TEXTURE_CUBE_MAP_POSITIVE_Z", e[e.TEXTURE_CUBE_MAP_NEGATIVE_Z = 34074] = "TEXTURE_CUBE_MAP_NEGATIVE_Z", e))(zi || {}), X = /* @__PURE__ */ ((e) => (e[e.UNSIGNED_BYTE = 5121] = "UNSIGNED_BYTE", e[e.UNSIGNED_SHORT = 5123] = "UNSIGNED_SHORT", e[e.UNSIGNED_SHORT_5_6_5 = 33635] = "UNSIGNED_SHORT_5_6_5", e[e.UNSIGNED_SHORT_4_4_4_4 = 32819] = "UNSIGNED_SHORT_4_4_4_4", e[e.UNSIGNED_SHORT_5_5_5_1 = 32820] = "UNSIGNED_SHORT_5_5_5_1", e[e.UNSIGNED_INT = 5125] = "UNSIGNED_INT", e[e.UNSIGNED_INT_10F_11F_11F_REV = 35899] = "UNSIGNED_INT_10F_11F_11F_REV", e[e.UNSIGNED_INT_2_10_10_10_REV = 33640] = "UNSIGNED_INT_2_10_10_10_REV", e[e.UNSIGNED_INT_24_8 = 34042] = "UNSIGNED_INT_24_8", e[e.UNSIGNED_INT_5_9_9_9_REV = 35902] = "UNSIGNED_INT_5_9_9_9_REV", e[e.BYTE = 5120] = "BYTE", e[e.SHORT = 5122] = "SHORT", e[e.INT = 5124] = "INT", e[e.FLOAT = 5126] = "FLOAT", e[e.FLOAT_32_UNSIGNED_INT_24_8_REV = 36269] = "FLOAT_32_UNSIGNED_INT_24_8_REV", e[e.HALF_FLOAT = 36193] = "HALF_FLOAT", e))(X || {}), Bi = {
	uint8x2: X.UNSIGNED_BYTE,
	uint8x4: X.UNSIGNED_BYTE,
	sint8x2: X.BYTE,
	sint8x4: X.BYTE,
	unorm8x2: X.UNSIGNED_BYTE,
	unorm8x4: X.UNSIGNED_BYTE,
	snorm8x2: X.BYTE,
	snorm8x4: X.BYTE,
	uint16x2: X.UNSIGNED_SHORT,
	uint16x4: X.UNSIGNED_SHORT,
	sint16x2: X.SHORT,
	sint16x4: X.SHORT,
	unorm16x2: X.UNSIGNED_SHORT,
	unorm16x4: X.UNSIGNED_SHORT,
	snorm16x2: X.SHORT,
	snorm16x4: X.SHORT,
	float16x2: X.HALF_FLOAT,
	float16x4: X.HALF_FLOAT,
	float32: X.FLOAT,
	float32x2: X.FLOAT,
	float32x3: X.FLOAT,
	float32x4: X.FLOAT,
	uint32: X.UNSIGNED_INT,
	uint32x2: X.UNSIGNED_INT,
	uint32x3: X.UNSIGNED_INT,
	uint32x4: X.UNSIGNED_INT,
	sint32: X.INT,
	sint32x2: X.INT,
	sint32x3: X.INT,
	sint32x4: X.INT
};
function Vi(e) {
	return Bi[e] ?? Bi.float32;
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/geometry/GlGeometrySystem.mjs
var Hi = {
	"point-list": 0,
	"line-list": 1,
	"line-strip": 3,
	"triangle-list": 4,
	"triangle-strip": 5
}, Ui = class {
	constructor() {
		this.vaoCache = /* @__PURE__ */ Object.create(null);
	}
	destroy() {
		this.vaoCache = /* @__PURE__ */ Object.create(null);
	}
}, Wi = class {
	constructor(e) {
		this._renderer = e, this._activeGeometry = null, this._activeVao = null, this.hasVao = !0, this.hasInstance = !0, this._managedGeometries = new V({
			renderer: e,
			type: "resource",
			onUnload: this.onGeometryUnload.bind(this),
			name: "glGeometry"
		});
	}
	contextChange() {
		let e = this.gl = this._renderer.gl;
		if (!this._renderer.context.supports.vertexArrayObject) throw Error("[PixiJS] Vertex Array Objects are not supported on this device");
		this.destroyAll(!0);
		let t = this._renderer.context.extensions.vertexArrayObject;
		t && (e.createVertexArray = () => t.createVertexArrayOES(), e.bindVertexArray = (e) => t.bindVertexArrayOES(e), e.deleteVertexArray = (e) => t.deleteVertexArrayOES(e));
		let n = this._renderer.context.extensions.vertexAttribDivisorANGLE;
		n && (e.drawArraysInstanced = (e, t, r, i) => {
			n.drawArraysInstancedANGLE(e, t, r, i);
		}, e.drawElementsInstanced = (e, t, r, i, a) => {
			n.drawElementsInstancedANGLE(e, t, r, i, a);
		}, e.vertexAttribDivisor = (e, t) => n.vertexAttribDivisorANGLE(e, t)), this._activeGeometry = null, this._activeVao = null;
	}
	bind(e, t) {
		let n = this.gl;
		this._activeGeometry = e;
		let r = this.getVao(e, t);
		this._activeVao !== r && (this._activeVao = r, n.bindVertexArray(r)), this.updateBuffers();
	}
	resetState() {
		this.unbind();
	}
	updateBuffers() {
		let e = this._activeGeometry, t = this._renderer.buffer;
		for (let n = 0; n < e.buffers.length; n++) {
			let r = e.buffers[n];
			t.updateBuffer(r);
		}
		e._gcLastUsed = this._renderer.gc.now;
	}
	checkCompatibility(e, t) {
		let n = e.attributes, r = t._attributeData;
		for (let e in r) if (!n[e]) throw Error(`shader and geometry incompatible, geometry missing the "${e}" attribute`);
	}
	getSignature(e, t) {
		let n = e.attributes, r = t._attributeData, i = ["g", e.uid];
		for (let e in n) r[e] && i.push(e, r[e].location);
		return i.join("-");
	}
	getVao(e, t) {
		return e._gpuData[this._renderer.uid]?.vaoCache[t._key] || this.initGeometryVao(e, t);
	}
	initGeometryVao(e, t, n = !0) {
		let r = this._renderer.gl, i = this._renderer.buffer;
		this._renderer.shader._getProgramData(t), this.checkCompatibility(e, t);
		let a = this.getSignature(e, t), o = e._gpuData[this._renderer.uid];
		o || (o = new Ui(), e._gpuData[this._renderer.uid] = o, this._managedGeometries.add(e));
		let s = o.vaoCache, c = s[a];
		if (c) return s[t._key] = c, c;
		Ge(e, t._attributeData);
		let l = e.buffers;
		c = r.createVertexArray(), r.bindVertexArray(c);
		for (let e = 0; e < l.length; e++) {
			let t = l[e];
			i.bind(t);
		}
		return this.activateVao(e, t), s[t._key] = c, s[a] = c, r.bindVertexArray(null), c;
	}
	onGeometryUnload(e, t = !1) {
		let n = e._gpuData[this._renderer.uid];
		if (!n) return;
		let r = n.vaoCache;
		if (!t) for (let e in r) this._activeVao !== r[e] && this.resetState(), this.gl.deleteVertexArray(r[e]);
	}
	destroyAll(e = !1) {
		this._managedGeometries.removeAll(e);
	}
	activateVao(e, t) {
		let n = this._renderer.gl, r = this._renderer.buffer, i = e.attributes;
		e.indexBuffer && r.bind(e.indexBuffer);
		let a = null;
		for (let e in i) {
			let o = i[e], s = o.buffer, c = r.getGlBuffer(s), l = t._attributeData[e];
			if (l) {
				a !== c && (r.bind(s), a = c);
				let e = l.location;
				n.enableVertexAttribArray(e);
				let t = h(o.format), i = Vi(o.format);
				if (l.format?.substring(1, 4) === "int" ? n.vertexAttribIPointer(e, t.size, i, o.stride, o.offset) : n.vertexAttribPointer(e, t.size, i, t.normalised, o.stride, o.offset), o.instance) if (this.hasInstance) {
					let t = o.divisor ?? 1;
					n.vertexAttribDivisor(e, t);
				} else throw Error("geometry error, GPU Instancing is not supported on this device");
			}
		}
	}
	draw(e, t, n, r) {
		let { gl: i } = this._renderer, a = this._activeGeometry, o = Hi[e || a.topology];
		if (r ??= a.instanceCount, a.indexBuffer) {
			let e = a.indexBuffer.data.BYTES_PER_ELEMENT, s = e === 2 ? i.UNSIGNED_SHORT : i.UNSIGNED_INT;
			r === 1 ? i.drawElements(o, t || a.indexBuffer.data.length, s, (n || 0) * e) : i.drawElementsInstanced(o, t || a.indexBuffer.data.length, s, (n || 0) * e, r);
		} else r === 1 ? i.drawArrays(o, n || 0, t || a.getSize()) : i.drawArraysInstanced(o, n || 0, t || a.getSize(), r);
		return this;
	}
	unbind() {
		this.gl.bindVertexArray(null), this._activeVao = null, this._activeGeometry = null;
	}
	destroy() {
		this._managedGeometries.destroy(), this._renderer = null, this.gl = null, this._activeVao = null, this._activeGeometry = null;
	}
};
Wi.extension = {
	type: [D.WebGLSystem],
	name: "geometry"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/GlBackBufferSystem.mjs
var Gi = new S({ attributes: { aPosition: [
	-1,
	-1,
	3,
	-1,
	-1,
	3
] } }), Ki = class e {
	constructor(e) {
		this.useBackBuffer = !1, this._useBackBufferThisRender = !1, this._renderer = e;
	}
	init(t = {}) {
		let { useBackBuffer: n, antialias: r } = {
			...e.defaultOptions,
			...t
		};
		this.useBackBuffer = n, this._antialias = r, this._renderer.context.supports.msaa || (w("antialiasing, is not supported on when using the back buffer"), this._antialias = !1), this._state = k.for2d();
		let i = new C({
			vertex: "\n                attribute vec2 aPosition;\n                out vec2 vUv;\n\n                void main() {\n                    gl_Position = vec4(aPosition, 0.0, 1.0);\n\n                    vUv = (aPosition + 1.0) / 2.0;\n\n                    // flip dem UVs\n                    vUv.y = 1.0 - vUv.y;\n                }",
			fragment: "\n                in vec2 vUv;\n                out vec4 finalColor;\n\n                uniform sampler2D uTexture;\n\n                void main() {\n                    finalColor = texture(uTexture, vUv);\n                }",
			name: "big-triangle"
		});
		this._bigTriangleShader = new f({
			glProgram: i,
			resources: { uTexture: T.WHITE.source }
		});
	}
	renderStart(e) {
		let t = this._renderer.renderTarget.getRenderTarget(e.target);
		if (this._useBackBufferThisRender = this.useBackBuffer && !!t.isRoot, this._useBackBufferThisRender) {
			let t = this._renderer.renderTarget.getRenderTarget(e.target);
			this._targetTexture = t.colorTexture, e.target = this._getBackBufferTexture(t.colorTexture);
		}
	}
	renderEnd() {
		this._presentBackBuffer();
	}
	_presentBackBuffer() {
		let e = this._renderer;
		e.renderTarget.finishRenderPass(), this._useBackBufferThisRender && (e.renderTarget.bind(this._targetTexture, !1), this._bigTriangleShader.resources.uTexture = this._backBufferTexture.source, e.encoder.draw({
			geometry: Gi,
			shader: this._bigTriangleShader,
			state: this._state
		}));
	}
	_getBackBufferTexture(e) {
		return this._backBufferTexture = this._backBufferTexture || new T({ source: new ee({
			width: e.width,
			height: e.height,
			resolution: e._resolution,
			antialias: this._antialias
		}) }), this._backBufferTexture.source.resize(e.width, e.height, e._resolution), this._backBufferTexture;
	}
	destroy() {
		this._backBufferTexture &&= (this._backBufferTexture.destroy(), null);
	}
};
Ki.extension = {
	type: [D.WebGLSystem],
	name: "backBuffer",
	priority: 1
}, Ki.defaultOptions = { useBackBuffer: !1 };
var qi = Ki, Ji = class {
	constructor(e) {
		this._colorMaskCache = 15, this._renderer = e;
	}
	setMask(e) {
		this._colorMaskCache !== e && (this._colorMaskCache = e, this._renderer.gl.colorMask(!!(e & 8), !!(e & 4), !!(e & 2), !!(e & 1)));
	}
};
Ji.extension = {
	type: [D.WebGLSystem],
	name: "colorMask"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/GlEncoderSystem.mjs
var Yi = class {
	constructor(e) {
		this.commandFinished = Promise.resolve(), this._renderer = e;
	}
	setGeometry(e, t) {
		this._renderer.geometry.bind(e, t.glProgram);
	}
	finishRenderPass() {}
	draw(e) {
		let t = this._renderer, { geometry: n, shader: r, state: i, skipSync: a, topology: o, size: s, start: c, instanceCount: l } = e;
		t.shader.bind(r, a), t.geometry.bind(n, t.shader._activeProgram), i && t.state.set(i), t.geometry.draw(o, s, c, l ?? n.instanceCount);
	}
	destroy() {
		this._renderer = null;
	}
};
Yi.extension = {
	type: [D.WebGLSystem],
	name: "encoder"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/GlLimitsSystem.mjs
var Xi = class {
	constructor(e) {
		this._renderer = e;
	}
	contextChange() {
		let e = this._renderer.gl;
		this.maxTextures = e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS), this.maxBatchableTextures = Te(this.maxTextures, e);
		let t = this._renderer.context.webGLVersion === 2;
		this.maxUniformBindings = t ? e.getParameter(e.MAX_UNIFORM_BUFFER_BINDINGS) : 0;
	}
	destroy() {}
};
Xi.extension = {
	type: [D.WebGLSystem],
	name: "limits"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/GlRenderTarget.mjs
var Zi = class {
	constructor() {
		this.width = -1, this.height = -1, this.msaa = !1, this._attachedMipLevel = 0, this._attachedLayer = 0, this.msaaRenderBuffer = [];
	}
}, Qi = class {
	constructor(e) {
		this._stencilCache = {
			enabled: !1,
			stencilReference: 0,
			stencilMode: B.NONE
		}, this._renderTargetStencilState = /* @__PURE__ */ Object.create(null), e.renderTarget.onRenderTargetChange.add(this);
	}
	contextChange(e) {
		this._gl = e, this._comparisonFuncMapping = {
			always: e.ALWAYS,
			never: e.NEVER,
			equal: e.EQUAL,
			"not-equal": e.NOTEQUAL,
			less: e.LESS,
			"less-equal": e.LEQUAL,
			greater: e.GREATER,
			"greater-equal": e.GEQUAL
		}, this._stencilOpsMapping = {
			keep: e.KEEP,
			zero: e.ZERO,
			replace: e.REPLACE,
			invert: e.INVERT,
			"increment-clamp": e.INCR,
			"decrement-clamp": e.DECR,
			"increment-wrap": e.INCR_WRAP,
			"decrement-wrap": e.DECR_WRAP
		}, this.resetState();
	}
	onRenderTargetChange(e) {
		if (this._activeRenderTarget === e) return;
		this._activeRenderTarget = e;
		let t = this._renderTargetStencilState[e.uid];
		t ||= this._renderTargetStencilState[e.uid] = {
			stencilMode: B.DISABLED,
			stencilReference: 0
		}, this.setStencilMode(t.stencilMode, t.stencilReference);
	}
	resetState() {
		this._stencilCache.enabled = !1, this._stencilCache.stencilMode = B.NONE, this._stencilCache.stencilReference = 0;
	}
	setStencilMode(e, t) {
		let n = this._renderTargetStencilState[this._activeRenderTarget.uid], r = this._gl, i = et[e], a = this._stencilCache;
		if (n.stencilMode = e, n.stencilReference = t, e === B.DISABLED) {
			this._stencilCache.enabled && (this._stencilCache.enabled = !1, r.disable(r.STENCIL_TEST));
			return;
		}
		this._stencilCache.enabled || (this._stencilCache.enabled = !0, r.enable(r.STENCIL_TEST)), (e !== a.stencilMode || a.stencilReference !== t) && (a.stencilMode = e, a.stencilReference = t, r.stencilFunc(this._comparisonFuncMapping[i.stencilBack.compare], t, 255), r.stencilOp(r.KEEP, r.KEEP, this._stencilOpsMapping[i.stencilBack.passOp]));
	}
};
Qi.extension = {
	type: [D.WebGLSystem],
	name: "stencil"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/shader/utils/createUboElementsSTD40.mjs
var $i = {
	f32: 4,
	i32: 4,
	"vec2<f32>": 8,
	"vec3<f32>": 12,
	"vec4<f32>": 16,
	"vec2<i32>": 8,
	"vec3<i32>": 12,
	"vec4<i32>": 16,
	"mat2x2<f32>": 32,
	"mat3x3<f32>": 48,
	"mat4x4<f32>": 64
};
function ea(e) {
	let t = e.map((e) => ({
		data: e,
		offset: 0,
		size: 0
	})), n = 0, r = 0;
	for (let e = 0; e < t.length; e++) {
		let i = t[e];
		if (n = $i[i.data.type], !n) throw Error(`Unknown type ${i.data.type}`);
		i.data.size > 1 && (n = Math.max(n, 16) * i.data.size);
		let a = n === 12 ? 16 : n;
		i.size = n;
		let o = r % 16;
		o > 0 && 16 - o < a ? r += (16 - o) % 16 : r += (n - o % n) % n, i.offset = r, r += n;
	}
	return r = Math.ceil(r / 16) * 16, {
		uboElements: t,
		size: r
	};
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/shader/utils/generateArraySyncSTD40.mjs
function ta(e, t) {
	let n = Math.max($i[e.data.type] / 16, 1), r = e.data.value.length / e.data.size, i = (4 - r % 4) % 4, a = e.data.type.indexOf("i32") >= 0 ? "dataInt32" : "data";
	return `
        v = uv.${e.data.name};
        offset += ${t};

        arrayOffset = offset;

        t = 0;

        for(var i=0; i < ${e.data.size * n}; i++)
        {
            for(var j = 0; j < ${r}; j++)
            {
                ${a}[arrayOffset++] = v[t++];
            }
            ${i === 0 ? "" : `arrayOffset += ${i};`}
        }
    `;
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/shader/utils/createUboSyncSTD40.mjs
function na(e) {
	return Je(e, "uboStd40", ta, Xe);
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/GlUboSystem.mjs
var ra = class extends Ze {
	constructor() {
		super({
			createUboElements: ea,
			generateUboSync: na
		});
	}
};
ra.extension = {
	type: [D.WebGLSystem],
	name: "ubo"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/renderTarget/GlRenderTargetAdaptor.mjs
var ia = class {
	constructor() {
		this._clearColorCache = [
			0,
			0,
			0,
			0
		], this._viewPortCache = new t();
	}
	init(e, t) {
		this._renderer = e, this._renderTargetSystem = t, e.runners.contextChange.add(this);
	}
	contextChange() {
		this._clearColorCache = [
			0,
			0,
			0,
			0
		], this._viewPortCache = new t();
		let e = this._renderer.gl;
		this._drawBuffersCache = [];
		for (let t = 1; t <= 16; t++) this._drawBuffersCache[t] = Array.from({ length: t }, (t, n) => e.COLOR_ATTACHMENT0 + n);
	}
	copyToTexture(e, t, n, r, i) {
		let a = this._renderTargetSystem, o = this._renderer, s = a.getGpuRenderTarget(e), c = o.gl;
		return this.finishRenderPass(e), c.bindFramebuffer(c.FRAMEBUFFER, s.resolveTargetFramebuffer), o.texture.bind(t, 0), c.copyTexSubImage2D(c.TEXTURE_2D, 0, i.x, i.y, n.x, n.y, r.width, r.height), t;
	}
	startRenderPass(e, t = !0, n, r, i = 0, a = 0) {
		let o = this._renderTargetSystem, s = e.colorTexture, c = o.getGpuRenderTarget(e);
		if (a !== 0 && this._renderer.context.webGLVersion < 2) throw Error("[RenderTargetSystem] Rendering to array layers requires WebGL2.");
		if (i > 0) {
			if (c.msaa) throw Error("[RenderTargetSystem] Rendering to mip levels is not supported with MSAA render targets.");
			if (this._renderer.context.webGLVersion < 2) throw Error("[RenderTargetSystem] Rendering to mip levels requires WebGL2.");
		}
		let l = r.y;
		e.isRoot && (l = s.pixelHeight - r.height - r.y), e.colorTextures.forEach((e) => {
			this._renderer.texture.unbind(e);
		});
		let u = this._renderer.gl;
		u.bindFramebuffer(u.FRAMEBUFFER, c.framebuffer), !e.isRoot && (c._attachedMipLevel !== i || c._attachedLayer !== a) && (e.colorTextures.forEach((e, t) => {
			let n = this._renderer.texture.getGlSource(e);
			if (n.target === u.TEXTURE_2D) {
				if (a !== 0) throw Error("[RenderTargetSystem] layer must be 0 when rendering to 2D textures in WebGL.");
				u.framebufferTexture2D(u.FRAMEBUFFER, u.COLOR_ATTACHMENT0 + t, u.TEXTURE_2D, n.texture, i);
			} else if (n.target === u.TEXTURE_2D_ARRAY) {
				if (this._renderer.context.webGLVersion < 2) throw Error("[RenderTargetSystem] Rendering to 2D array textures requires WebGL2.");
				u.framebufferTextureLayer(u.FRAMEBUFFER, u.COLOR_ATTACHMENT0 + t, n.texture, i, a);
			} else if (n.target === u.TEXTURE_CUBE_MAP) {
				if (a < 0 || a > 5) throw Error("[RenderTargetSystem] Cube map layer must be between 0 and 5.");
				u.framebufferTexture2D(u.FRAMEBUFFER, u.COLOR_ATTACHMENT0 + t, u.TEXTURE_CUBE_MAP_POSITIVE_X + a, n.texture, i);
			} else throw Error("[RenderTargetSystem] Unsupported texture target for render-to-layer in WebGL.");
		}), c._attachedMipLevel = i, c._attachedLayer = a), e.colorTextures.length > 1 && this._setDrawBuffers(e, u);
		let d = this._viewPortCache;
		(d.x !== r.x || d.y !== l || d.width !== r.width || d.height !== r.height) && (d.x = r.x, d.y = l, d.width = r.width, d.height = r.height, u.viewport(r.x, l, r.width, r.height)), !c.depthStencilRenderBuffer && (e.stencil || e.depth) && this._initStencil(c), this.clear(e, t, n);
	}
	finishRenderPass(e) {
		let t = this._renderTargetSystem.getGpuRenderTarget(e);
		if (!t.msaa) return;
		let n = this._renderer.gl;
		n.bindFramebuffer(n.FRAMEBUFFER, t.resolveTargetFramebuffer), n.bindFramebuffer(n.READ_FRAMEBUFFER, t.framebuffer), n.blitFramebuffer(0, 0, t.width, t.height, 0, 0, t.width, t.height, n.COLOR_BUFFER_BIT, n.NEAREST), n.bindFramebuffer(n.FRAMEBUFFER, t.framebuffer);
	}
	initGpuRenderTarget(e) {
		let t = this._renderer.gl, n = new Zi();
		return n._attachedMipLevel = 0, n._attachedLayer = 0, e.colorTexture instanceof O ? (this._renderer.context.ensureCanvasSize(e.colorTexture.resource), n.framebuffer = null, n) : (this._initColor(e, n), t.bindFramebuffer(t.FRAMEBUFFER, null), n);
	}
	destroyGpuRenderTarget(e) {
		let t = this._renderer.gl;
		e.framebuffer &&= (t.deleteFramebuffer(e.framebuffer), null), e.resolveTargetFramebuffer &&= (t.deleteFramebuffer(e.resolveTargetFramebuffer), null), e.depthStencilRenderBuffer &&= (t.deleteRenderbuffer(e.depthStencilRenderBuffer), null), e.msaaRenderBuffer.forEach((e) => {
			t.deleteRenderbuffer(e);
		}), e.msaaRenderBuffer = null;
	}
	clear(e, t, n, r, i = 0, a = 0) {
		if (!t) return;
		if (a !== 0) throw Error("[RenderTargetSystem] Clearing array layers is not supported in WebGL renderer.");
		let o = this._renderTargetSystem;
		typeof t == "boolean" && (t = t ? z.ALL : z.NONE);
		let s = this._renderer.gl;
		if (t & z.COLOR) {
			n ??= o.defaultClearColor;
			let e = this._clearColorCache, t = n;
			(e[0] !== t[0] || e[1] !== t[1] || e[2] !== t[2] || e[3] !== t[3]) && (e[0] = t[0], e[1] = t[1], e[2] = t[2], e[3] = t[3], s.clearColor(t[0], t[1], t[2], t[3]));
		}
		s.clear(t);
	}
	resizeGpuRenderTarget(e) {
		if (e.isRoot) return;
		let t = this._renderTargetSystem.getGpuRenderTarget(e);
		this._resizeColor(e, t), (e.stencil || e.depth) && this._resizeStencil(t);
	}
	_initColor(e, t) {
		let n = this._renderer, r = n.gl, i = r.createFramebuffer();
		if (t.resolveTargetFramebuffer = i, r.bindFramebuffer(r.FRAMEBUFFER, i), t.width = e.colorTexture.source.pixelWidth, t.height = e.colorTexture.source.pixelHeight, e.colorTextures.forEach((e, i) => {
			let a = e.source;
			a.antialias && (n.context.supports.msaa ? t.msaa = !0 : w("[RenderTexture] Antialiasing on textures is not supported in WebGL1")), n.texture.bindSource(a, 0);
			let o = n.texture.getGlSource(a), s = o.texture;
			if (o.target === r.TEXTURE_2D) r.framebufferTexture2D(r.FRAMEBUFFER, r.COLOR_ATTACHMENT0 + i, r.TEXTURE_2D, s, 0);
			else if (o.target === r.TEXTURE_2D_ARRAY) {
				if (n.context.webGLVersion < 2) throw Error("[RenderTargetSystem] TEXTURE_2D_ARRAY requires WebGL2.");
				r.framebufferTextureLayer(r.FRAMEBUFFER, r.COLOR_ATTACHMENT0 + i, s, 0, 0);
			} else if (o.target === r.TEXTURE_CUBE_MAP) r.framebufferTexture2D(r.FRAMEBUFFER, r.COLOR_ATTACHMENT0 + i, r.TEXTURE_CUBE_MAP_POSITIVE_X, s, 0);
			else throw Error("[RenderTargetSystem] Unsupported texture target for framebuffer attachment.");
		}), t.msaa) {
			let n = r.createFramebuffer();
			t.framebuffer = n, r.bindFramebuffer(r.FRAMEBUFFER, n), e.colorTextures.forEach((e, n) => {
				let i = r.createRenderbuffer();
				t.msaaRenderBuffer[n] = i;
			});
		} else t.framebuffer = i;
		this._resizeColor(e, t);
	}
	_resizeColor(e, t) {
		let n = e.colorTexture.source;
		if (t.width = n.pixelWidth, t.height = n.pixelHeight, t._attachedMipLevel = 0, t._attachedLayer = 0, e.colorTextures.forEach((e, t) => {
			t !== 0 && e.source.resize(n.width, n.height, n._resolution);
		}), t.msaa) {
			let n = this._renderer, r = n.gl, i = t.framebuffer;
			r.bindFramebuffer(r.FRAMEBUFFER, i), e.colorTextures.forEach((e, i) => {
				let a = e.source;
				n.texture.bindSource(a, 0);
				let o = n.texture.getGlSource(a).internalFormat, s = t.msaaRenderBuffer[i];
				r.bindRenderbuffer(r.RENDERBUFFER, s), r.renderbufferStorageMultisample(r.RENDERBUFFER, 4, o, a.pixelWidth, a.pixelHeight), r.framebufferRenderbuffer(r.FRAMEBUFFER, r.COLOR_ATTACHMENT0 + i, r.RENDERBUFFER, s);
			});
		}
	}
	_initStencil(e) {
		if (e.framebuffer === null) return;
		let t = this._renderer.gl, n = t.createRenderbuffer();
		e.depthStencilRenderBuffer = n, t.bindRenderbuffer(t.RENDERBUFFER, n), t.framebufferRenderbuffer(t.FRAMEBUFFER, t.DEPTH_STENCIL_ATTACHMENT, t.RENDERBUFFER, n), this._resizeStencil(e);
	}
	_resizeStencil(e) {
		let t = this._renderer.gl;
		t.bindRenderbuffer(t.RENDERBUFFER, e.depthStencilRenderBuffer), e.msaa ? t.renderbufferStorageMultisample(t.RENDERBUFFER, 4, t.DEPTH24_STENCIL8, e.width, e.height) : t.renderbufferStorage(t.RENDERBUFFER, this._renderer.context.webGLVersion === 2 ? t.DEPTH24_STENCIL8 : t.DEPTH_STENCIL, e.width, e.height);
	}
	prerender(e) {
		let t = e.colorTexture.resource;
		this._renderer.context.multiView && O.test(t) && this._renderer.context.ensureCanvasSize(t);
	}
	postrender(e) {
		if (this._renderer.context.multiView && O.test(e.colorTexture.resource)) {
			let t = this._renderer.context.canvas, n = e.colorTexture;
			n.context2D.drawImage(t, 0, n.pixelHeight - t.height);
		}
	}
	_setDrawBuffers(e, t) {
		let n = e.colorTextures.length, r = this._drawBuffersCache[n];
		if (this._renderer.context.webGLVersion === 1) {
			let e = this._renderer.context.extensions.drawBuffers;
			e ? e.drawBuffersWEBGL(r) : w("[RenderTexture] This WebGL1 context does not support rendering to multiple targets");
		} else t.drawBuffers(r);
	}
}, aa = class extends be {
	constructor(e) {
		super(e), this.adaptor = new ia(), this.adaptor.init(e, this);
	}
};
aa.extension = {
	type: [D.WebGLSystem],
	name: "renderTarget"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/shader/GenerateShaderSyncCode.mjs
function oa(e, t) {
	let n = [], r = ["\n        var g = s.groups;\n        var sS = r.shader;\n        var p = s.glProgram;\n        var ugS = r.uniformGroup;\n        var resources;\n    "], i = !1, a = 0, o = t._getProgramData(e.glProgram);
	for (let s in e.groups) {
		let c = e.groups[s];
		n.push(`
            resources = g[${s}].resources;
        `);
		for (let l in c.resources) {
			let u = c.resources[l];
			if (u instanceof x) if (u.ubo) {
				let t = e._uniformBindMap[s][Number(l)];
				n.push(`
                        sS.bindUniformBlock(
                            resources[${l}],
                            '${t}',
                            ${e.glProgram._uniformBlockData[t].index}
                        );
                    `);
			} else n.push(`
                        ugS.updateUniformGroup(resources[${l}], p, sD);
                    `);
			else if (u instanceof tt) {
				let t = e._uniformBindMap[s][Number(l)];
				n.push(`
                    sS.bindUniformBlock(
                        resources[${l}],
                        '${t}',
                        ${e.glProgram._uniformBlockData[t].index}
                    );
                `);
			} else if (u instanceof ee) {
				let c = e._uniformBindMap[s][l], u = o.uniformData[c];
				u && (i || (i = !0, r.push("\n                        var tS = r.texture;\n                        ")), t._gl.uniform1i(u.location, a), n.push(`
                        tS.bind(resources[${l}], ${a});
                    `), a++);
			}
		}
	}
	let s = [...r, ...n].join("\n");
	return Function("r", "s", "sD", s);
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/shader/GlProgramData.mjs
var sa = class {
	constructor(e, t) {
		this.program = e, this.uniformData = t, this.uniformGroups = {}, this.uniformDirtyGroups = {}, this.uniformBlockBindings = {};
	}
	destroy() {
		this.uniformData = null, this.uniformGroups = null, this.uniformDirtyGroups = null, this.uniformBlockBindings = null, this.program = null;
	}
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/compileShader.mjs
function ca(e, t, n) {
	let r = e.createShader(t);
	return e.shaderSource(r, n), e.compileShader(r), r;
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/defaultValue.mjs
function la(e) {
	let t = Array(e);
	for (let e = 0; e < t.length; e++) t[e] = !1;
	return t;
}
function ua(e, t) {
	switch (e) {
		case "float": return 0;
		case "vec2": return new Float32Array(2 * t);
		case "vec3": return new Float32Array(3 * t);
		case "vec4": return new Float32Array(4 * t);
		case "int":
		case "uint":
		case "sampler2D":
		case "sampler2DArray": return 0;
		case "ivec2": return new Int32Array(2 * t);
		case "ivec3": return new Int32Array(3 * t);
		case "ivec4": return new Int32Array(4 * t);
		case "uvec2": return new Uint32Array(2 * t);
		case "uvec3": return new Uint32Array(3 * t);
		case "uvec4": return new Uint32Array(4 * t);
		case "bool": return !1;
		case "bvec2": return la(2 * t);
		case "bvec3": return la(3 * t);
		case "bvec4": return la(4 * t);
		case "mat2": return new Float32Array([
			1,
			0,
			0,
			1
		]);
		case "mat3": return new Float32Array([
			1,
			0,
			0,
			0,
			1,
			0,
			0,
			0,
			1
		]);
		case "mat4": return new Float32Array([
			1,
			0,
			0,
			0,
			0,
			1,
			0,
			0,
			0,
			0,
			1,
			0,
			0,
			0,
			0,
			1
		]);
	}
	return null;
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/mapType.mjs
var da = null, fa = {
	FLOAT: "float",
	FLOAT_VEC2: "vec2",
	FLOAT_VEC3: "vec3",
	FLOAT_VEC4: "vec4",
	INT: "int",
	INT_VEC2: "ivec2",
	INT_VEC3: "ivec3",
	INT_VEC4: "ivec4",
	UNSIGNED_INT: "uint",
	UNSIGNED_INT_VEC2: "uvec2",
	UNSIGNED_INT_VEC3: "uvec3",
	UNSIGNED_INT_VEC4: "uvec4",
	BOOL: "bool",
	BOOL_VEC2: "bvec2",
	BOOL_VEC3: "bvec3",
	BOOL_VEC4: "bvec4",
	FLOAT_MAT2: "mat2",
	FLOAT_MAT3: "mat3",
	FLOAT_MAT4: "mat4",
	SAMPLER_2D: "sampler2D",
	INT_SAMPLER_2D: "sampler2D",
	UNSIGNED_INT_SAMPLER_2D: "sampler2D",
	SAMPLER_CUBE: "samplerCube",
	INT_SAMPLER_CUBE: "samplerCube",
	UNSIGNED_INT_SAMPLER_CUBE: "samplerCube",
	SAMPLER_2D_ARRAY: "sampler2DArray",
	INT_SAMPLER_2D_ARRAY: "sampler2DArray",
	UNSIGNED_INT_SAMPLER_2D_ARRAY: "sampler2DArray"
}, pa = {
	float: "float32",
	vec2: "float32x2",
	vec3: "float32x3",
	vec4: "float32x4",
	int: "sint32",
	ivec2: "sint32x2",
	ivec3: "sint32x3",
	ivec4: "sint32x4",
	uint: "uint32",
	uvec2: "uint32x2",
	uvec3: "uint32x3",
	uvec4: "uint32x4",
	bool: "uint32",
	bvec2: "uint32x2",
	bvec3: "uint32x3",
	bvec4: "uint32x4"
};
function ma(e, t) {
	if (!da) {
		let t = Object.keys(fa);
		da = {};
		for (let n = 0; n < t.length; ++n) {
			let r = t[n];
			da[e[r]] = fa[r];
		}
	}
	return da[t];
}
function ha(e, t) {
	return pa[ma(e, t)] || "float32";
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/extractAttributesFromGlProgram.mjs
function ga(e, t, n = !1) {
	let r = {}, i = t.getProgramParameter(e, t.ACTIVE_ATTRIBUTES);
	for (let n = 0; n < i; n++) {
		let i = t.getActiveAttrib(e, n);
		if (i.name.startsWith("gl_")) continue;
		let a = ha(t, i.type);
		r[i.name] = {
			location: 0,
			format: a,
			stride: h(a).stride,
			offset: 0,
			instance: !1,
			start: 0
		};
	}
	let a = Object.keys(r);
	if (n) {
		a.sort((e, t) => e > t ? 1 : -1);
		for (let n = 0; n < a.length; n++) r[a[n]].location = n, t.bindAttribLocation(e, n, a[n]);
		t.linkProgram(e);
	} else for (let n = 0; n < a.length; n++) r[a[n]].location = t.getAttribLocation(e, a[n]);
	return r;
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/getUboData.mjs
function _a(e, t) {
	if (!t.ACTIVE_UNIFORM_BLOCKS) return {};
	let n = {}, r = t.getProgramParameter(e, t.ACTIVE_UNIFORM_BLOCKS);
	for (let i = 0; i < r; i++) {
		let r = t.getActiveUniformBlockName(e, i);
		n[r] = {
			name: r,
			index: t.getUniformBlockIndex(e, r),
			size: t.getActiveUniformBlockParameter(e, i, t.UNIFORM_BLOCK_DATA_SIZE)
		};
	}
	return n;
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/getUniformData.mjs
function va(e, t) {
	let n = {}, r = t.getProgramParameter(e, t.ACTIVE_UNIFORMS);
	for (let i = 0; i < r; i++) {
		let r = t.getActiveUniform(e, i), a = r.name.replace(/\[.*?\]$/, ""), o = !!r.name.match(/\[.*?\]$/), s = ma(t, r.type);
		n[a] = {
			name: a,
			index: i,
			type: s,
			size: r.size,
			isArray: o,
			value: ua(s, r.size)
		};
	}
	return n;
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/logProgramError.mjs
function ya(e, t) {
	let n = e.getShaderSource(t);
	if (n === null) {
		console.error("PixiJS Error: Could not retrieve shader source (WebGL context may be lost).");
		return;
	}
	let r = n.split("\n").map((e, t) => `${t}: ${e}`), i = e.getShaderInfoLog(t) ?? "", a = i.split("\n"), o = {}, s = a.map((e) => parseFloat(e.replace(/^ERROR\: 0\:([\d]+)\:.*$/, "$1"))).filter((e) => e && !o[e] ? (o[e] = !0, !0) : !1), c = [""];
	s.forEach((e) => {
		r[e - 1] = `%c${r[e - 1]}%c`, c.push("background: #FF0000; color:#FFFFFF; font-size: 10px", "font-size: 10px");
	}), c[0] = r.join("\n"), console.error(i), console.groupCollapsed("click to view full shader code"), console.warn(...c), console.groupEnd();
}
function ba(e, t, n, r) {
	e.getProgramParameter(t, e.LINK_STATUS) || (e.getShaderParameter(n, e.COMPILE_STATUS) || ya(e, n), e.getShaderParameter(r, e.COMPILE_STATUS) || ya(e, r), console.error("PixiJS Error: Could not initialize shader."), e.getProgramInfoLog(t) !== "" && console.warn("PixiJS Warning: gl.getProgramInfoLog()", e.getProgramInfoLog(t)));
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/generateProgram.mjs
function xa(e, t) {
	let n = ca(e, e.VERTEX_SHADER, t.vertex), r = ca(e, e.FRAGMENT_SHADER, t.fragment), i = e.createProgram();
	e.attachShader(i, n), e.attachShader(i, r);
	let a = t.transformFeedbackVaryings;
	a && (typeof e.transformFeedbackVaryings == "function" ? e.transformFeedbackVaryings(i, a.names, a.bufferMode === "separate" ? e.SEPARATE_ATTRIBS : e.INTERLEAVED_ATTRIBS) : w("TransformFeedback is not supported but TransformFeedbackVaryings are given.")), e.linkProgram(i), e.getProgramParameter(i, e.LINK_STATUS) || ba(e, i, n, r), t._attributeData = ga(i, e, !/^[ \t]*#[ \t]*version[ \t]+300[ \t]+es[ \t]*$/m.test(t.vertex)), t._uniformData = va(i, e), t._uniformBlockData = _a(i, e), e.deleteShader(n), e.deleteShader(r);
	let o = {};
	for (let n in t._uniformData) {
		let r = t._uniformData[n];
		o[n] = {
			location: e.getUniformLocation(i, n),
			value: ua(r.type, r.size)
		};
	}
	return new sa(i, o);
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/shader/GlShaderSystem.mjs
var Sa = {
	textureCount: 0,
	blockIndex: 0
}, Ca = class {
	constructor(e) {
		this._activeProgram = null, this._programDataHash = /* @__PURE__ */ Object.create(null), this._shaderSyncFunctions = /* @__PURE__ */ Object.create(null), this._renderer = e;
	}
	contextChange(e) {
		this._gl = e, this._programDataHash = /* @__PURE__ */ Object.create(null), this._shaderSyncFunctions = /* @__PURE__ */ Object.create(null), this._activeProgram = null;
	}
	bind(e, t) {
		if (this._setProgram(e.glProgram), t) return;
		Sa.textureCount = 0, Sa.blockIndex = 0;
		let n = this._shaderSyncFunctions[e.glProgram._key];
		n ||= this._shaderSyncFunctions[e.glProgram._key] = this._generateShaderSync(e, this), this._renderer.buffer.nextBindBase(!!e.glProgram.transformFeedbackVaryings), n(this._renderer, e, Sa);
	}
	updateUniformGroup(e) {
		this._renderer.uniformGroup.updateUniformGroup(e, this._activeProgram, Sa);
	}
	bindUniformBlock(e, t, n = 0) {
		let r = this._renderer.buffer, i = this._getProgramData(this._activeProgram), a = e._bufferResource;
		a || this._renderer.ubo.updateUniformGroup(e);
		let o = e.buffer, s = r.updateBuffer(o), c = r.freeLocationForBufferBase(s);
		if (a) {
			let { offset: t, size: n } = e;
			t === 0 && n === o.data.byteLength ? r.bindBufferBase(s, c) : r.bindBufferRange(s, c, t);
		} else r.getLastBindBaseLocation(s) !== c && r.bindBufferBase(s, c);
		let l = this._activeProgram._uniformBlockData[t].index;
		i.uniformBlockBindings[n] !== c && (i.uniformBlockBindings[n] = c, this._renderer.gl.uniformBlockBinding(i.program, l, c));
	}
	_setProgram(e) {
		if (this._activeProgram === e) return;
		this._activeProgram = e;
		let t = this._getProgramData(e);
		this._gl.useProgram(t.program);
	}
	_getProgramData(e) {
		return this._programDataHash[e._key] || this._createProgramData(e);
	}
	_createProgramData(e) {
		let t = e._key;
		return this._programDataHash[t] = xa(this._gl, e), this._programDataHash[t];
	}
	destroy() {
		for (let e of Object.keys(this._programDataHash)) this._programDataHash[e].destroy();
		this._programDataHash = null, this._shaderSyncFunctions = null, this._activeProgram = null, this._renderer = null, this._gl = null;
	}
	_generateShaderSync(e, t) {
		return oa(e, t);
	}
	resetState() {
		this._activeProgram = null;
	}
};
Ca.extension = {
	type: [D.WebGLSystem],
	name: "shader"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/shader/utils/generateUniformsSyncTypes.mjs
var wa = {
	f32: "if (cv !== v) {\n            cu.value = v;\n            gl.uniform1f(location, v);\n        }",
	"vec2<f32>": "if (cv[0] !== v[0] || cv[1] !== v[1]) {\n            cv[0] = v[0];\n            cv[1] = v[1];\n            gl.uniform2f(location, v[0], v[1]);\n        }",
	"vec3<f32>": "if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2]) {\n            cv[0] = v[0];\n            cv[1] = v[1];\n            cv[2] = v[2];\n            gl.uniform3f(location, v[0], v[1], v[2]);\n        }",
	"vec4<f32>": "if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3]) {\n            cv[0] = v[0];\n            cv[1] = v[1];\n            cv[2] = v[2];\n            cv[3] = v[3];\n            gl.uniform4f(location, v[0], v[1], v[2], v[3]);\n        }",
	i32: "if (cv !== v) {\n            cu.value = v;\n            gl.uniform1i(location, v);\n        }",
	"vec2<i32>": "if (cv[0] !== v[0] || cv[1] !== v[1]) {\n            cv[0] = v[0];\n            cv[1] = v[1];\n            gl.uniform2i(location, v[0], v[1]);\n        }",
	"vec3<i32>": "if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2]) {\n            cv[0] = v[0];\n            cv[1] = v[1];\n            cv[2] = v[2];\n            gl.uniform3i(location, v[0], v[1], v[2]);\n        }",
	"vec4<i32>": "if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3]) {\n            cv[0] = v[0];\n            cv[1] = v[1];\n            cv[2] = v[2];\n            cv[3] = v[3];\n            gl.uniform4i(location, v[0], v[1], v[2], v[3]);\n        }",
	u32: "if (cv !== v) {\n            cu.value = v;\n            gl.uniform1ui(location, v);\n        }",
	"vec2<u32>": "if (cv[0] !== v[0] || cv[1] !== v[1]) {\n            cv[0] = v[0];\n            cv[1] = v[1];\n            gl.uniform2ui(location, v[0], v[1]);\n        }",
	"vec3<u32>": "if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2]) {\n            cv[0] = v[0];\n            cv[1] = v[1];\n            cv[2] = v[2];\n            gl.uniform3ui(location, v[0], v[1], v[2]);\n        }",
	"vec4<u32>": "if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3]) {\n            cv[0] = v[0];\n            cv[1] = v[1];\n            cv[2] = v[2];\n            cv[3] = v[3];\n            gl.uniform4ui(location, v[0], v[1], v[2], v[3]);\n        }",
	bool: "if (cv !== v) {\n            cu.value = v;\n            gl.uniform1i(location, v);\n        }",
	"vec2<bool>": "if (cv[0] !== v[0] || cv[1] !== v[1]) {\n            cv[0] = v[0];\n            cv[1] = v[1];\n            gl.uniform2i(location, v[0], v[1]);\n        }",
	"vec3<bool>": "if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2]) {\n            cv[0] = v[0];\n            cv[1] = v[1];\n            cv[2] = v[2];\n            gl.uniform3i(location, v[0], v[1], v[2]);\n        }",
	"vec4<bool>": "if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3]) {\n            cv[0] = v[0];\n            cv[1] = v[1];\n            cv[2] = v[2];\n            cv[3] = v[3];\n            gl.uniform4i(location, v[0], v[1], v[2], v[3]);\n        }",
	"mat2x2<f32>": "gl.uniformMatrix2fv(location, false, v);",
	"mat3x3<f32>": "gl.uniformMatrix3fv(location, false, v);",
	"mat4x4<f32>": "gl.uniformMatrix4fv(location, false, v);"
}, Ta = {
	f32: "gl.uniform1fv(location, v);",
	"vec2<f32>": "gl.uniform2fv(location, v);",
	"vec3<f32>": "gl.uniform3fv(location, v);",
	"vec4<f32>": "gl.uniform4fv(location, v);",
	"mat2x2<f32>": "gl.uniformMatrix2fv(location, false, v);",
	"mat3x3<f32>": "gl.uniformMatrix3fv(location, false, v);",
	"mat4x4<f32>": "gl.uniformMatrix4fv(location, false, v);",
	i32: "gl.uniform1iv(location, v);",
	"vec2<i32>": "gl.uniform2iv(location, v);",
	"vec3<i32>": "gl.uniform3iv(location, v);",
	"vec4<i32>": "gl.uniform4iv(location, v);",
	u32: "gl.uniform1iv(location, v);",
	"vec2<u32>": "gl.uniform2iv(location, v);",
	"vec3<u32>": "gl.uniform3iv(location, v);",
	"vec4<u32>": "gl.uniform4iv(location, v);",
	bool: "gl.uniform1iv(location, v);",
	"vec2<bool>": "gl.uniform2iv(location, v);",
	"vec3<bool>": "gl.uniform3iv(location, v);",
	"vec4<bool>": "gl.uniform4iv(location, v);"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/shader/utils/generateUniformsSync.mjs
function Ea(e, t) {
	let n = ["\n        var v = null;\n        var cv = null;\n        var cu = null;\n        var t = 0;\n        var gl = renderer.gl;\n        var name = null;\n    "];
	for (let r in e.uniforms) {
		if (!t[r]) {
			e.uniforms[r] instanceof x ? e.uniforms[r].ubo ? n.push(`
                        renderer.shader.bindUniformBlock(uv.${r}, "${r}");
                    `) : n.push(`
                        renderer.shader.updateUniformGroup(uv.${r});
                    `) : e.uniforms[r] instanceof tt && n.push(`
                        renderer.shader.bindBufferResource(uv.${r}, "${r}");
                    `);
			continue;
		}
		let i = e.uniformStructures[r], a = !1;
		for (let e = 0; e < We.length; e++) {
			let t = We[e];
			if (i.type === t.type && t.test(i)) {
				n.push(`name = "${r}";`, We[e].uniform), a = !0;
				break;
			}
		}
		if (!a) {
			let e = (i.size === 1 ? wa : Ta)[i.type].replace("location", `ud["${r}"].location`);
			n.push(`
            cu = ud["${r}"];
            cv = cu.value;
            v = uv["${r}"];
            ${e};`);
		}
	}
	return Function("ud", "uv", "renderer", "syncData", n.join("\n"));
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/shader/GlUniformGroupSystem.mjs
var Da = class {
	constructor(e) {
		this._cache = {}, this._uniformGroupSyncHash = {}, this._renderer = e, this.gl = null, this._cache = {};
	}
	contextChange(e) {
		this.gl = e;
	}
	updateUniformGroup(e, t, n) {
		let r = this._renderer.shader._getProgramData(t);
		(!e.isStatic || e._dirtyId !== r.uniformDirtyGroups[e.uid]) && (r.uniformDirtyGroups[e.uid] = e._dirtyId, this._getUniformSyncFunction(e, t)(r.uniformData, e.uniforms, this._renderer, n));
	}
	_getUniformSyncFunction(e, t) {
		return this._uniformGroupSyncHash[e._signature]?.[t._key] || this._createUniformSyncFunction(e, t);
	}
	_createUniformSyncFunction(e, t) {
		let n = this._uniformGroupSyncHash[e._signature] || (this._uniformGroupSyncHash[e._signature] = {}), r = this._getSignature(e, t._uniformData, "u");
		return this._cache[r] || (this._cache[r] = this._generateUniformsSync(e, t._uniformData)), n[t._key] = this._cache[r], n[t._key];
	}
	_generateUniformsSync(e, t) {
		return Ea(e, t);
	}
	_getSignature(e, t, n) {
		let r = e.uniforms, i = [`${n}-`];
		for (let e in r) i.push(e), t[e] && i.push(t[e].type);
		return i.join("-");
	}
	destroy() {
		this._renderer = null, this._cache = null;
	}
};
Da.extension = {
	type: [D.WebGLSystem],
	name: "uniformGroup"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/state/mapWebGLBlendModesToPixi.mjs
function Oa(e) {
	let t = {};
	if (t.normal = [e.ONE, e.ONE_MINUS_SRC_ALPHA], t.add = [e.ONE, e.ONE], t.multiply = [
		e.DST_COLOR,
		e.ONE_MINUS_SRC_ALPHA,
		e.ONE,
		e.ONE_MINUS_SRC_ALPHA
	], t.screen = [
		e.ONE,
		e.ONE_MINUS_SRC_COLOR,
		e.ONE,
		e.ONE_MINUS_SRC_ALPHA
	], t.none = [0, 0], t["normal-npm"] = [
		e.SRC_ALPHA,
		e.ONE_MINUS_SRC_ALPHA,
		e.ONE,
		e.ONE_MINUS_SRC_ALPHA
	], t["add-npm"] = [
		e.SRC_ALPHA,
		e.ONE,
		e.ONE,
		e.ONE
	], t["screen-npm"] = [
		e.SRC_ALPHA,
		e.ONE_MINUS_SRC_COLOR,
		e.ONE,
		e.ONE_MINUS_SRC_ALPHA
	], t.erase = [e.ZERO, e.ONE_MINUS_SRC_ALPHA], !(e instanceof y.get().getWebGLRenderingContext())) t.min = [
		e.ONE,
		e.ONE,
		e.ONE,
		e.ONE,
		e.MIN,
		e.MIN
	], t.max = [
		e.ONE,
		e.ONE,
		e.ONE,
		e.ONE,
		e.MAX,
		e.MAX
	];
	else {
		let n = e.getExtension("EXT_blend_minmax");
		n && (t.min = [
			e.ONE,
			e.ONE,
			e.ONE,
			e.ONE,
			n.MIN_EXT,
			n.MIN_EXT
		], t.max = [
			e.ONE,
			e.ONE,
			e.ONE,
			e.ONE,
			n.MAX_EXT,
			n.MAX_EXT
		]);
	}
	return t;
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/state/GlStateSystem.mjs
var ka = 0, Aa = 1, ja = 2, Ma = 3, Na = 4, Pa = 5, Fa = class e {
	constructor(e) {
		this._invertFrontFace = !1, this.gl = null, this.stateId = 0, this.polygonOffset = 0, this.blendMode = "none", this._blendEq = !1, this.map = [], this.map[ka] = this.setBlend, this.map[Aa] = this.setOffset, this.map[ja] = this.setCullFace, this.map[Ma] = this.setDepthTest, this.map[Na] = this.setFrontFace, this.map[Pa] = this.setDepthMask, this.checks = [], this.defaultState = k.for2d(), e.renderTarget.onRenderTargetChange.add(this);
	}
	onRenderTargetChange(e) {
		this._invertFrontFace = !e.isRoot, this._cullFace ? this.setFrontFace(this._frontFace) : this._frontFaceDirty = !0;
	}
	contextChange(e) {
		this.gl = e, this.blendModesMap = Oa(e), this.resetState();
	}
	set(e) {
		if (e ||= this.defaultState, this.stateId !== e.data) {
			let t = this.stateId ^ e.data, n = 0;
			for (; t;) t & 1 && this.map[n].call(this, !!(e.data & 1 << n)), t >>= 1, n++;
			this.stateId = e.data;
		}
		for (let t = 0; t < this.checks.length; t++) this.checks[t](this, e);
	}
	forceState(e) {
		e ||= this.defaultState;
		for (let t = 0; t < this.map.length; t++) this.map[t].call(this, !!(e.data & 1 << t));
		for (let t = 0; t < this.checks.length; t++) this.checks[t](this, e);
		this.stateId = e.data;
	}
	setBlend(t) {
		this._updateCheck(e._checkBlendMode, t), this.gl[t ? "enable" : "disable"](this.gl.BLEND);
	}
	setOffset(t) {
		this._updateCheck(e._checkPolygonOffset, t), this.gl[t ? "enable" : "disable"](this.gl.POLYGON_OFFSET_FILL);
	}
	setDepthTest(e) {
		this.gl[e ? "enable" : "disable"](this.gl.DEPTH_TEST);
	}
	setDepthMask(e) {
		this.gl.depthMask(e);
	}
	setCullFace(e) {
		this._cullFace = e, this.gl[e ? "enable" : "disable"](this.gl.CULL_FACE), this._cullFace && this._frontFaceDirty && this.setFrontFace(this._frontFace);
	}
	setFrontFace(e) {
		this._frontFace = e, this._frontFaceDirty = !1;
		let t = this._invertFrontFace ? !e : e;
		this._glFrontFace !== t && (this._glFrontFace = t, this.gl.frontFace(this.gl[t ? "CW" : "CCW"]));
	}
	setBlendMode(e) {
		if (this.blendModesMap[e] || (e = "normal"), e === this.blendMode) return;
		this.blendMode = e;
		let t = this.blendModesMap[e], n = this.gl;
		t.length === 2 ? n.blendFunc(t[0], t[1]) : n.blendFuncSeparate(t[0], t[1], t[2], t[3]), t.length === 6 ? (this._blendEq = !0, n.blendEquationSeparate(t[4], t[5])) : this._blendEq && (this._blendEq = !1, n.blendEquationSeparate(n.FUNC_ADD, n.FUNC_ADD));
	}
	setPolygonOffset(e, t) {
		this.gl.polygonOffset(e, t);
	}
	resetState() {
		this._glFrontFace = !1, this._frontFace = !1, this._cullFace = !1, this._frontFaceDirty = !1, this._invertFrontFace = !1, this.gl.frontFace(this.gl.CCW), this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, !1), this.forceState(this.defaultState), this._blendEq = !0, this.blendMode = "", this.setBlendMode("normal");
	}
	_updateCheck(e, t) {
		let n = this.checks.indexOf(e);
		t && n === -1 ? this.checks.push(e) : !t && n !== -1 && this.checks.splice(n, 1);
	}
	static _checkBlendMode(e, t) {
		e.setBlendMode(t.blendMode);
	}
	static _checkPolygonOffset(e, t) {
		e.setPolygonOffset(1, t.polygonOffset);
	}
	destroy() {
		this.gl = null, this.checks.length = 0;
	}
};
Fa.extension = {
	type: [D.WebGLSystem],
	name: "state"
};
var Ia = Fa, La = class {
	constructor(e) {
		this.target = zi.TEXTURE_2D, this._layerInitMask = 0, this.texture = e, this.width = -1, this.height = -1, this.type = X.UNSIGNED_BYTE, this.internalFormat = Ri.RGBA, this.format = Ri.RGBA, this.samplerType = 0;
	}
	destroy() {}
}, Ra = {
	id: "buffer",
	upload(e, t, n, r, i, a = !1) {
		let o = i || t.target;
		!a && t.width === e.width && t.height === e.height ? n.texSubImage2D(o, 0, 0, 0, e.width, e.height, t.format, t.type, e.resource) : n.texImage2D(o, 0, t.internalFormat, e.width, e.height, 0, t.format, t.type, e.resource), t.width = e.width, t.height = e.height;
	}
}, za = {
	"bc1-rgba-unorm": !0,
	"bc1-rgba-unorm-srgb": !0,
	"bc2-rgba-unorm": !0,
	"bc2-rgba-unorm-srgb": !0,
	"bc3-rgba-unorm": !0,
	"bc3-rgba-unorm-srgb": !0,
	"bc4-r-unorm": !0,
	"bc4-r-snorm": !0,
	"bc5-rg-unorm": !0,
	"bc5-rg-snorm": !0,
	"bc6h-rgb-ufloat": !0,
	"bc6h-rgb-float": !0,
	"bc7-rgba-unorm": !0,
	"bc7-rgba-unorm-srgb": !0,
	"etc2-rgb8unorm": !0,
	"etc2-rgb8unorm-srgb": !0,
	"etc2-rgb8a1unorm": !0,
	"etc2-rgb8a1unorm-srgb": !0,
	"etc2-rgba8unorm": !0,
	"etc2-rgba8unorm-srgb": !0,
	"eac-r11unorm": !0,
	"eac-r11snorm": !0,
	"eac-rg11unorm": !0,
	"eac-rg11snorm": !0,
	"astc-4x4-unorm": !0,
	"astc-4x4-unorm-srgb": !0,
	"astc-5x4-unorm": !0,
	"astc-5x4-unorm-srgb": !0,
	"astc-5x5-unorm": !0,
	"astc-5x5-unorm-srgb": !0,
	"astc-6x5-unorm": !0,
	"astc-6x5-unorm-srgb": !0,
	"astc-6x6-unorm": !0,
	"astc-6x6-unorm-srgb": !0,
	"astc-8x5-unorm": !0,
	"astc-8x5-unorm-srgb": !0,
	"astc-8x6-unorm": !0,
	"astc-8x6-unorm-srgb": !0,
	"astc-8x8-unorm": !0,
	"astc-8x8-unorm-srgb": !0,
	"astc-10x5-unorm": !0,
	"astc-10x5-unorm-srgb": !0,
	"astc-10x6-unorm": !0,
	"astc-10x6-unorm-srgb": !0,
	"astc-10x8-unorm": !0,
	"astc-10x8-unorm-srgb": !0,
	"astc-10x10-unorm": !0,
	"astc-10x10-unorm-srgb": !0,
	"astc-12x10-unorm": !0,
	"astc-12x10-unorm-srgb": !0,
	"astc-12x12-unorm": !0,
	"astc-12x12-unorm-srgb": !0
}, Ba = {
	id: "compressed",
	upload(e, t, n, r, i, a) {
		let o = i ?? t.target;
		n.pixelStorei(n.UNPACK_ALIGNMENT, 4);
		let s = e.pixelWidth, c = e.pixelHeight, l = !!za[e.format];
		for (let r = 0; r < e.resource.length; r++) {
			let i = e.resource[r];
			l ? n.compressedTexImage2D(o, r, t.internalFormat, s, c, 0, i) : n.texImage2D(o, r, t.internalFormat, s, c, 0, t.format, t.type, i), s = Math.max(s >> 1, 1), c = Math.max(c >> 1, 1);
		}
	}
}, Va = [
	"right",
	"left",
	"top",
	"bottom",
	"front",
	"back"
];
function Ha(e) {
	return {
		id: "cube",
		upload(t, n, r, i) {
			let a = t.faces;
			for (let t = 0; t < Va.length; t++) {
				let o = a[Va[t]];
				(e[o.uploadMethodId] || e.image).upload(o, n, r, i, zi.TEXTURE_CUBE_MAP_POSITIVE_X + t, (n._layerInitMask & 1 << t) == 0), n._layerInitMask |= 1 << t;
			}
			n.width = t.pixelWidth, n.height = t.pixelHeight;
		}
	};
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/texture/uploaders/glUploadImageResource.mjs
var Ua = {
	id: "image",
	upload(e, t, n, r, i, a = !1) {
		let o = i || t.target, s = e.pixelWidth, c = e.pixelHeight, l = e.resourceWidth, u = e.resourceHeight, d = r === 2, f = a || t.width !== s || t.height !== c, p = l >= s && u >= c, m = e.resource;
		(d ? Wa : Ga)(n, o, t, s, c, l, u, m, f, p), t.width = s, t.height = c;
	}
};
function Wa(e, t, n, r, i, a, o, s, c, l) {
	if (!l) {
		c && e.texImage2D(t, 0, n.internalFormat, r, i, 0, n.format, n.type, null), e.texSubImage2D(t, 0, 0, 0, a, o, n.format, n.type, s);
		return;
	}
	if (!c) {
		e.texSubImage2D(t, 0, 0, 0, n.format, n.type, s);
		return;
	}
	e.texImage2D(t, 0, n.internalFormat, r, i, 0, n.format, n.type, s);
}
function Ga(e, t, n, r, i, a, o, s, c, l) {
	if (!l) {
		c && e.texImage2D(t, 0, n.internalFormat, r, i, 0, n.format, n.type, null), e.texSubImage2D(t, 0, 0, 0, n.format, n.type, s);
		return;
	}
	if (!c) {
		e.texSubImage2D(t, 0, 0, 0, n.format, n.type, s);
		return;
	}
	e.texImage2D(t, 0, n.internalFormat, n.format, n.type, s);
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/texture/uploaders/glUploadVideoResource.mjs
var Ka = Jr(), qa = {
	id: "video",
	upload(e, t, n, r, i, a = Ka) {
		if (!e.isValid) {
			let e = i ?? t.target;
			n.texImage2D(e, 0, t.internalFormat, 1, 1, 0, t.format, t.type, null);
			return;
		}
		Ua.upload(e, t, n, r, i, a);
	}
}, Ja = {
	linear: 9729,
	nearest: 9728
}, Ya = {
	linear: {
		linear: 9987,
		nearest: 9985
	},
	nearest: {
		linear: 9986,
		nearest: 9984
	}
}, Xa = {
	"clamp-to-edge": 33071,
	repeat: 10497,
	"mirror-repeat": 33648
}, Za = {
	never: 512,
	less: 513,
	equal: 514,
	"less-equal": 515,
	greater: 516,
	"not-equal": 517,
	"greater-equal": 518,
	always: 519
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/texture/utils/applyStyleParams.mjs
function Qa(e, t, n, r, i, a, o, s) {
	let c = a;
	if (!s || e.addressModeU !== "repeat" || e.addressModeV !== "repeat" || e.addressModeW !== "repeat") {
		let n = Xa[o ? "clamp-to-edge" : e.addressModeU], r = Xa[o ? "clamp-to-edge" : e.addressModeV], a = Xa[o ? "clamp-to-edge" : e.addressModeW];
		t[i](c, t.TEXTURE_WRAP_S, n), t[i](c, t.TEXTURE_WRAP_T, r), t.TEXTURE_WRAP_R && t[i](c, t.TEXTURE_WRAP_R, a);
	}
	if ((!s || e.magFilter !== "linear") && t[i](c, t.TEXTURE_MAG_FILTER, Ja[e.magFilter]), n) {
		if (!s || e.mipmapFilter !== "linear") {
			let n = Ya[e.minFilter][e.mipmapFilter];
			t[i](c, t.TEXTURE_MIN_FILTER, n);
		}
	} else t[i](c, t.TEXTURE_MIN_FILTER, Ja[e.minFilter]);
	if (r && e.maxAnisotropy > 1) {
		let n = Math.min(e.maxAnisotropy, t.getParameter(r.MAX_TEXTURE_MAX_ANISOTROPY_EXT));
		t[i](c, r.TEXTURE_MAX_ANISOTROPY_EXT, n);
	}
	e.compare && t[i](c, t.TEXTURE_COMPARE_FUNC, Za[e.compare]);
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/texture/utils/mapFormatToGlFormat.mjs
function $a(e) {
	return {
		r8unorm: e.RED,
		r8snorm: e.RED,
		r8uint: e.RED,
		r8sint: e.RED,
		r16uint: e.RED,
		r16sint: e.RED,
		r16float: e.RED,
		rg8unorm: e.RG,
		rg8snorm: e.RG,
		rg8uint: e.RG,
		rg8sint: e.RG,
		r32uint: e.RED,
		r32sint: e.RED,
		r32float: e.RED,
		rg16uint: e.RG,
		rg16sint: e.RG,
		rg16float: e.RG,
		rgba8unorm: e.RGBA,
		"rgba8unorm-srgb": e.RGBA,
		rgba8snorm: e.RGBA,
		rgba8uint: e.RGBA,
		rgba8sint: e.RGBA,
		bgra8unorm: e.RGBA,
		"bgra8unorm-srgb": e.RGBA,
		rgb9e5ufloat: e.RGB,
		rgb10a2unorm: e.RGBA,
		rg11b10ufloat: e.RGB,
		rg32uint: e.RG,
		rg32sint: e.RG,
		rg32float: e.RG,
		rgba16uint: e.RGBA,
		rgba16sint: e.RGBA,
		rgba16float: e.RGBA,
		rgba32uint: e.RGBA,
		rgba32sint: e.RGBA,
		rgba32float: e.RGBA,
		stencil8: e.STENCIL_INDEX8,
		depth16unorm: e.DEPTH_COMPONENT,
		depth24plus: e.DEPTH_COMPONENT,
		"depth24plus-stencil8": e.DEPTH_STENCIL,
		depth32float: e.DEPTH_COMPONENT,
		"depth32float-stencil8": e.DEPTH_STENCIL
	};
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/texture/utils/mapFormatToGlInternalFormat.mjs
function eo(e, t) {
	let n = {}, r = e.RGBA;
	return e instanceof y.get().getWebGLRenderingContext() ? t.srgb && (n = {
		"rgba8unorm-srgb": t.srgb.SRGB8_ALPHA8_EXT,
		"bgra8unorm-srgb": t.srgb.SRGB8_ALPHA8_EXT
	}) : (n = {
		"rgba8unorm-srgb": e.SRGB8_ALPHA8,
		"bgra8unorm-srgb": e.SRGB8_ALPHA8
	}, r = e.RGBA8), {
		r8unorm: e.R8,
		r8snorm: e.R8_SNORM,
		r8uint: e.R8UI,
		r8sint: e.R8I,
		r16uint: e.R16UI,
		r16sint: e.R16I,
		r16float: e.R16F,
		rg8unorm: e.RG8,
		rg8snorm: e.RG8_SNORM,
		rg8uint: e.RG8UI,
		rg8sint: e.RG8I,
		r32uint: e.R32UI,
		r32sint: e.R32I,
		r32float: e.R32F,
		rg16uint: e.RG16UI,
		rg16sint: e.RG16I,
		rg16float: e.RG16F,
		rgba8unorm: e.RGBA,
		...n,
		rgba8snorm: e.RGBA8_SNORM,
		rgba8uint: e.RGBA8UI,
		rgba8sint: e.RGBA8I,
		bgra8unorm: r,
		rgb9e5ufloat: e.RGB9_E5,
		rgb10a2unorm: e.RGB10_A2,
		rg11b10ufloat: e.R11F_G11F_B10F,
		rg32uint: e.RG32UI,
		rg32sint: e.RG32I,
		rg32float: e.RG32F,
		rgba16uint: e.RGBA16UI,
		rgba16sint: e.RGBA16I,
		rgba16float: e.RGBA16F,
		rgba32uint: e.RGBA32UI,
		rgba32sint: e.RGBA32I,
		rgba32float: e.RGBA32F,
		stencil8: e.STENCIL_INDEX8,
		depth16unorm: e.DEPTH_COMPONENT16,
		depth24plus: e.DEPTH_COMPONENT24,
		"depth24plus-stencil8": e.DEPTH24_STENCIL8,
		depth32float: e.DEPTH_COMPONENT32F,
		"depth32float-stencil8": e.DEPTH32F_STENCIL8,
		...t.s3tc ? {
			"bc1-rgba-unorm": t.s3tc.COMPRESSED_RGBA_S3TC_DXT1_EXT,
			"bc2-rgba-unorm": t.s3tc.COMPRESSED_RGBA_S3TC_DXT3_EXT,
			"bc3-rgba-unorm": t.s3tc.COMPRESSED_RGBA_S3TC_DXT5_EXT
		} : {},
		...t.s3tc_sRGB ? {
			"bc1-rgba-unorm-srgb": t.s3tc_sRGB.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT,
			"bc2-rgba-unorm-srgb": t.s3tc_sRGB.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT,
			"bc3-rgba-unorm-srgb": t.s3tc_sRGB.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT
		} : {},
		...t.rgtc ? {
			"bc4-r-unorm": t.rgtc.COMPRESSED_RED_RGTC1_EXT,
			"bc4-r-snorm": t.rgtc.COMPRESSED_SIGNED_RED_RGTC1_EXT,
			"bc5-rg-unorm": t.rgtc.COMPRESSED_RED_GREEN_RGTC2_EXT,
			"bc5-rg-snorm": t.rgtc.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT
		} : {},
		...t.bptc ? {
			"bc6h-rgb-float": t.bptc.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT,
			"bc6h-rgb-ufloat": t.bptc.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT,
			"bc7-rgba-unorm": t.bptc.COMPRESSED_RGBA_BPTC_UNORM_EXT,
			"bc7-rgba-unorm-srgb": t.bptc.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT
		} : {},
		...t.etc ? {
			"etc2-rgb8unorm": t.etc.COMPRESSED_RGB8_ETC2,
			"etc2-rgb8unorm-srgb": t.etc.COMPRESSED_SRGB8_ETC2,
			"etc2-rgb8a1unorm": t.etc.COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2,
			"etc2-rgb8a1unorm-srgb": t.etc.COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2,
			"etc2-rgba8unorm": t.etc.COMPRESSED_RGBA8_ETC2_EAC,
			"etc2-rgba8unorm-srgb": t.etc.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC,
			"eac-r11unorm": t.etc.COMPRESSED_R11_EAC,
			"eac-rg11unorm": t.etc.COMPRESSED_SIGNED_RG11_EAC
		} : {},
		...t.astc ? {
			"astc-4x4-unorm": t.astc.COMPRESSED_RGBA_ASTC_4x4_KHR,
			"astc-4x4-unorm-srgb": t.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR,
			"astc-5x4-unorm": t.astc.COMPRESSED_RGBA_ASTC_5x4_KHR,
			"astc-5x4-unorm-srgb": t.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR,
			"astc-5x5-unorm": t.astc.COMPRESSED_RGBA_ASTC_5x5_KHR,
			"astc-5x5-unorm-srgb": t.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR,
			"astc-6x5-unorm": t.astc.COMPRESSED_RGBA_ASTC_6x5_KHR,
			"astc-6x5-unorm-srgb": t.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR,
			"astc-6x6-unorm": t.astc.COMPRESSED_RGBA_ASTC_6x6_KHR,
			"astc-6x6-unorm-srgb": t.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR,
			"astc-8x5-unorm": t.astc.COMPRESSED_RGBA_ASTC_8x5_KHR,
			"astc-8x5-unorm-srgb": t.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR,
			"astc-8x6-unorm": t.astc.COMPRESSED_RGBA_ASTC_8x6_KHR,
			"astc-8x6-unorm-srgb": t.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR,
			"astc-8x8-unorm": t.astc.COMPRESSED_RGBA_ASTC_8x8_KHR,
			"astc-8x8-unorm-srgb": t.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR,
			"astc-10x5-unorm": t.astc.COMPRESSED_RGBA_ASTC_10x5_KHR,
			"astc-10x5-unorm-srgb": t.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR,
			"astc-10x6-unorm": t.astc.COMPRESSED_RGBA_ASTC_10x6_KHR,
			"astc-10x6-unorm-srgb": t.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR,
			"astc-10x8-unorm": t.astc.COMPRESSED_RGBA_ASTC_10x8_KHR,
			"astc-10x8-unorm-srgb": t.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR,
			"astc-10x10-unorm": t.astc.COMPRESSED_RGBA_ASTC_10x10_KHR,
			"astc-10x10-unorm-srgb": t.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR,
			"astc-12x10-unorm": t.astc.COMPRESSED_RGBA_ASTC_12x10_KHR,
			"astc-12x10-unorm-srgb": t.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR,
			"astc-12x12-unorm": t.astc.COMPRESSED_RGBA_ASTC_12x12_KHR,
			"astc-12x12-unorm-srgb": t.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR
		} : {}
	};
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/texture/utils/mapFormatToGlType.mjs
function to(e) {
	return {
		r8unorm: e.UNSIGNED_BYTE,
		r8snorm: e.BYTE,
		r8uint: e.UNSIGNED_BYTE,
		r8sint: e.BYTE,
		r16uint: e.UNSIGNED_SHORT,
		r16sint: e.SHORT,
		r16float: e.HALF_FLOAT,
		rg8unorm: e.UNSIGNED_BYTE,
		rg8snorm: e.BYTE,
		rg8uint: e.UNSIGNED_BYTE,
		rg8sint: e.BYTE,
		r32uint: e.UNSIGNED_INT,
		r32sint: e.INT,
		r32float: e.FLOAT,
		rg16uint: e.UNSIGNED_SHORT,
		rg16sint: e.SHORT,
		rg16float: e.HALF_FLOAT,
		rgba8unorm: e.UNSIGNED_BYTE,
		"rgba8unorm-srgb": e.UNSIGNED_BYTE,
		rgba8snorm: e.BYTE,
		rgba8uint: e.UNSIGNED_BYTE,
		rgba8sint: e.BYTE,
		bgra8unorm: e.UNSIGNED_BYTE,
		"bgra8unorm-srgb": e.UNSIGNED_BYTE,
		rgb9e5ufloat: e.UNSIGNED_INT_5_9_9_9_REV,
		rgb10a2unorm: e.UNSIGNED_INT_2_10_10_10_REV,
		rg11b10ufloat: e.UNSIGNED_INT_10F_11F_11F_REV,
		rg32uint: e.UNSIGNED_INT,
		rg32sint: e.INT,
		rg32float: e.FLOAT,
		rgba16uint: e.UNSIGNED_SHORT,
		rgba16sint: e.SHORT,
		rgba16float: e.HALF_FLOAT,
		rgba32uint: e.UNSIGNED_INT,
		rgba32sint: e.INT,
		rgba32float: e.FLOAT,
		stencil8: e.UNSIGNED_BYTE,
		depth16unorm: e.UNSIGNED_SHORT,
		depth24plus: e.UNSIGNED_INT,
		"depth24plus-stencil8": e.UNSIGNED_INT_24_8,
		depth32float: e.FLOAT,
		"depth32float-stencil8": e.FLOAT_32_UNSIGNED_INT_24_8_REV
	};
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/texture/utils/mapViewDimensionToGlTarget.mjs
function no(e) {
	return {
		"2d": e.TEXTURE_2D,
		cube: e.TEXTURE_CUBE_MAP,
		"1d": null,
		"3d": e?.TEXTURE_3D || null,
		"2d-array": e?.TEXTURE_2D_ARRAY || null,
		"cube-array": e?.TEXTURE_CUBE_MAP_ARRAY || null
	};
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/texture/GlTextureSystem.mjs
var ro = 4, io = class e {
	constructor(t) {
		this._glSamplers = /* @__PURE__ */ Object.create(null), this._boundTextures = [], this._activeTextureLocation = -1, this._boundSamplers = /* @__PURE__ */ Object.create(null), this._premultiplyAlpha = !1, this._useSeparateSamplers = !1, this._renderer = t, this._managedTextures = new V({
			renderer: t,
			type: "resource",
			onUnload: this.onSourceUnload.bind(this),
			name: "glTexture"
		});
		let n = {
			image: Ua,
			buffer: Ra,
			video: qa,
			compressed: Ba,
			...e.uploadExtensions
		};
		this._uploads = {
			...n,
			cube: Ha(n)
		};
	}
	get managedTextures() {
		return Object.values(this._managedTextures.items);
	}
	contextChange(e) {
		this._gl = e, this._mapFormatToInternalFormat || (this._mapFormatToInternalFormat = eo(e, this._renderer.context.extensions), this._mapFormatToType = to(e), this._mapFormatToFormat = $a(e), this._mapViewDimensionToGlTarget = no(e)), this._managedTextures.removeAll(!0), this._glSamplers = /* @__PURE__ */ Object.create(null), this._boundSamplers = /* @__PURE__ */ Object.create(null), this._premultiplyAlpha = !1;
		for (let e = 0; e < 16; e++) this.bind(T.EMPTY, e);
	}
	initSource(e) {
		this.bind(e);
	}
	bind(e, t = 0) {
		let n = e.source;
		e ? (this.bindSource(n, t), this._useSeparateSamplers && this._bindSampler(n.style, t)) : (this.bindSource(null, t), this._useSeparateSamplers && this._bindSampler(null, t));
	}
	bindSource(e, t = 0) {
		let n = this._gl;
		if (e._gcLastUsed = this._renderer.gc.now, this._boundTextures[t] !== e) {
			this._boundTextures[t] = e, this._activateLocation(t), e ||= T.EMPTY.source;
			let r = this.getGlSource(e);
			n.bindTexture(r.target, r.texture);
		}
	}
	_bindSampler(e, t = 0) {
		let n = this._gl;
		if (!e) {
			this._boundSamplers[t] = null, n.bindSampler(t, null);
			return;
		}
		let r = this._getGlSampler(e);
		this._boundSamplers[t] !== r && (this._boundSamplers[t] = r, n.bindSampler(t, r));
	}
	unbind(e) {
		let t = e.source, n = this._boundTextures, r = this._gl;
		for (let e = 0; e < n.length; e++) if (n[e] === t) {
			this._activateLocation(e);
			let i = this.getGlSource(t);
			r.bindTexture(i.target, null), n[e] = null;
		}
	}
	_activateLocation(e) {
		this._activeTextureLocation !== e && (this._activeTextureLocation = e, this._gl.activeTexture(this._gl.TEXTURE0 + e));
	}
	_initSource(e) {
		let t = this._gl, n = new La(t.createTexture());
		if (n.type = this._mapFormatToType[e.format], n.internalFormat = this._mapFormatToInternalFormat[e.format], n.format = this._mapFormatToFormat[e.format], n.target = this._mapViewDimensionToGlTarget[e.viewDimension], n.target === null) throw Error(`Unsupported view dimension: ${e.viewDimension} with this webgl version: ${this._renderer.context.webGLVersion}`);
		if (e.uploadMethodId === "cube" && (n.target = t.TEXTURE_CUBE_MAP), e.autoGenerateMipmaps && (this._renderer.context.supports.nonPowOf2mipmaps || e.isPowerOfTwo)) {
			let t = Math.max(e.width, e.height);
			e.mipLevelCount = Math.floor(Math.log2(t)) + 1;
		}
		return e._gpuData[this._renderer.uid] = n, this._managedTextures.add(e) && (e.on("update", this.onSourceUpdate, this), e.on("resize", this.onSourceUpdate, this), e.on("styleChange", this.onStyleChange, this), e.on("updateMipmaps", this.onUpdateMipmaps, this)), this.onSourceUpdate(e), this.updateStyle(e, !1), n;
	}
	onStyleChange(e) {
		this.updateStyle(e, !1);
	}
	updateStyle(e, t) {
		let n = this._gl, r = this.getGlSource(e);
		n.bindTexture(r.target, r.texture), this._boundTextures[this._activeTextureLocation] = e, Qa(e.style, n, e.mipLevelCount > 1, this._renderer.context.extensions.anisotropicFiltering, "texParameteri", r.target, !this._renderer.context.supports.nonPowOf2wrapping && !e.isPowerOfTwo, t);
	}
	onSourceUnload(e, t = !1) {
		let n = e._gpuData[this._renderer.uid];
		n && (t || (this.unbind(e), this._gl.deleteTexture(n.texture)), e.off("update", this.onSourceUpdate, this), e.off("resize", this.onSourceUpdate, this), e.off("styleChange", this.onStyleChange, this), e.off("updateMipmaps", this.onUpdateMipmaps, this));
	}
	onSourceUpdate(e) {
		let t = this._gl, n = this.getGlSource(e);
		t.bindTexture(n.target, n.texture), this._boundTextures[this._activeTextureLocation] = e;
		let r = e.alphaMode === "premultiply-alpha-on-upload";
		if (this._premultiplyAlpha !== r && (this._premultiplyAlpha = r, t.pixelStorei(t.UNPACK_PREMULTIPLY_ALPHA_WEBGL, r)), this._uploads[e.uploadMethodId]) this._uploads[e.uploadMethodId].upload(e, n, t, this._renderer.context.webGLVersion);
		else if (n.target === t.TEXTURE_2D) this._initEmptyTexture2D(n, e);
		else if (n.target === t.TEXTURE_2D_ARRAY) this._initEmptyTexture2DArray(n, e);
		else if (n.target === t.TEXTURE_CUBE_MAP) this._initEmptyTextureCube(n, e);
		else throw Error("[GlTextureSystem] Unsupported texture target for empty allocation.");
		this._applyMipRange(n, e), e.autoGenerateMipmaps && e.mipLevelCount > 1 && this.onUpdateMipmaps(e, !1);
	}
	onUpdateMipmaps(e, t = !0) {
		t && this.bindSource(e, 0);
		let n = this.getGlSource(e);
		this._gl.generateMipmap(n.target);
	}
	_initEmptyTexture2D(e, t) {
		let n = this._gl;
		n.texImage2D(n.TEXTURE_2D, 0, e.internalFormat, t.pixelWidth, t.pixelHeight, 0, e.format, e.type, null);
		let r = Math.max(t.pixelWidth >> 1, 1), i = Math.max(t.pixelHeight >> 1, 1);
		for (let a = 1; a < t.mipLevelCount; a++) n.texImage2D(n.TEXTURE_2D, a, e.internalFormat, r, i, 0, e.format, e.type, null), r = Math.max(r >> 1, 1), i = Math.max(i >> 1, 1);
	}
	_initEmptyTexture2DArray(e, t) {
		if (this._renderer.context.webGLVersion !== 2) throw Error("[GlTextureSystem] TEXTURE_2D_ARRAY requires WebGL2.");
		let n = this._gl, r = Math.max(t.arrayLayerCount | 0, 1);
		n.texImage3D(n.TEXTURE_2D_ARRAY, 0, e.internalFormat, t.pixelWidth, t.pixelHeight, r, 0, e.format, e.type, null);
		let i = Math.max(t.pixelWidth >> 1, 1), a = Math.max(t.pixelHeight >> 1, 1);
		for (let o = 1; o < t.mipLevelCount; o++) n.texImage3D(n.TEXTURE_2D_ARRAY, o, e.internalFormat, i, a, r, 0, e.format, e.type, null), i = Math.max(i >> 1, 1), a = Math.max(a >> 1, 1);
	}
	_initEmptyTextureCube(e, t) {
		let n = this._gl;
		for (let r = 0; r < 6; r++) n.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X + r, 0, e.internalFormat, t.pixelWidth, t.pixelHeight, 0, e.format, e.type, null);
		let r = Math.max(t.pixelWidth >> 1, 1), i = Math.max(t.pixelHeight >> 1, 1);
		for (let a = 1; a < t.mipLevelCount; a++) {
			for (let t = 0; t < 6; t++) n.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X + t, a, e.internalFormat, r, i, 0, e.format, e.type, null);
			r = Math.max(r >> 1, 1), i = Math.max(i >> 1, 1);
		}
	}
	_applyMipRange(e, t) {
		if (this._renderer.context.webGLVersion !== 2 || t.mipLevelCount <= 1) return;
		let n = this._gl, r = Math.max((t.mipLevelCount | 0) - 1, 0);
		n.texParameteri(e.target, n.TEXTURE_BASE_LEVEL, 0), n.texParameteri(e.target, n.TEXTURE_MAX_LEVEL, r);
	}
	_initSampler(e) {
		let t = this._gl, n = this._gl.createSampler();
		return this._glSamplers[e._resourceId] = n, Qa(e, t, this._boundTextures[this._activeTextureLocation].mipLevelCount > 1, this._renderer.context.extensions.anisotropicFiltering, "samplerParameteri", n, !1, !0), this._glSamplers[e._resourceId];
	}
	_getGlSampler(e) {
		return this._glSamplers[e._resourceId] || this._initSampler(e);
	}
	getGlSource(e) {
		return e._gcLastUsed = this._renderer.gc.now, e._gpuData[this._renderer.uid] || this._initSource(e);
	}
	generateCanvas(e) {
		let { pixels: t, width: n, height: r } = this.getPixels(e), i = y.get().createCanvas();
		i.width = n, i.height = r;
		let a = i.getContext("2d");
		if (a) {
			let e = a.createImageData(n, r);
			e.data.set(t), a.putImageData(e, 0, 0);
		}
		return i;
	}
	getPixels(e) {
		let t = e.source.resolution, n = e.frame, r = Math.max(Math.round(n.width * t), 1), i = Math.max(Math.round(n.height * t), 1), a = new Uint8Array(ro * r * i), o = this._renderer, s = o.renderTarget.getRenderTarget(e), c = o.renderTarget.getGpuRenderTarget(s), l = o.gl;
		return l.bindFramebuffer(l.FRAMEBUFFER, c.resolveTargetFramebuffer), l.readPixels(Math.round(n.x * t), Math.round(n.y * t), r, i, l.RGBA, l.UNSIGNED_BYTE, a), {
			pixels: new Uint8ClampedArray(a.buffer),
			width: r,
			height: i
		};
	}
	destroy() {
		this._managedTextures.destroy(), this._glSamplers = null, this._boundTextures = null, this._boundSamplers = null, this._mapFormatToInternalFormat = null, this._mapFormatToType = null, this._mapFormatToFormat = null, this._uploads = null, this._renderer = null;
	}
	resetState() {
		this._activeTextureLocation = -1, this._boundTextures.fill(T.EMPTY.source), this._boundSamplers = /* @__PURE__ */ Object.create(null);
		let e = this._gl;
		this._premultiplyAlpha = !1, e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL, this._premultiplyAlpha);
	}
};
io.extension = {
	type: [D.WebGLSystem],
	name: "texture"
}, io.uploadExtensions = /* @__PURE__ */ Object.create(null);
var ao = io;
e.handleByMap(D.TextureUploaderWebGL, ao.uploadExtensions);
//#endregion
//#region node_modules/pixi.js/lib/scene/graphics/gl/GlGraphicsAdaptor.mjs
var oo = class {
	contextChange(e) {
		let t = new x({
			uColor: {
				value: new Float32Array([
					1,
					1,
					1,
					1
				]),
				type: "vec4<f32>"
			},
			uTransformMatrix: {
				value: new i(),
				type: "mat3x3<f32>"
			},
			uRound: {
				value: 0,
				type: "f32"
			}
		}), n = e.limits.maxBatchableTextures, r = Me({
			name: "graphics",
			bits: [
				De,
				je(n),
				qe,
				Se
			]
		});
		this.shader = new f({
			glProgram: r,
			resources: {
				localUniforms: t,
				batchSamplers: Ae(n)
			}
		});
	}
	execute(e, t) {
		let n = t.context, r = n.customShader || this.shader, i = e.renderer, { batcher: a, instructions: o } = i.graphicsContext.getContextRenderData(n);
		r.groups[0] = i.globalUniforms.bindGroup, i.state.set(e.state), i.shader.bind(r), i.geometry.bind(a.geometry, r.glProgram);
		let s = o.instructions;
		for (let e = 0; e < o.instructionSize; e++) {
			let t = s[e];
			if (t.size) {
				for (let e = 0; e < t.textures.count; e++) i.texture.bind(t.textures.textures[e], e);
				i.geometry.draw(t.topology, t.size, t.start);
			}
		}
	}
	destroy() {
		this.shader.destroy(!0), this.shader = null;
	}
};
oo.extension = {
	type: [D.WebGLPipesAdaptor],
	name: "graphics"
};
//#endregion
//#region node_modules/pixi.js/lib/scene/mesh/gl/GlMeshAdaptor.mjs
var so = class {
	init() {
		let e = Me({
			name: "mesh",
			bits: [
				qe,
				nt,
				Se
			]
		});
		this._shader = new f({
			glProgram: e,
			resources: {
				uTexture: T.EMPTY.source,
				textureUniforms: { uTextureMatrix: {
					type: "mat3x3<f32>",
					value: new i()
				} }
			}
		});
	}
	execute(e, t) {
		let n = e.renderer, r = t._shader;
		if (!r) {
			r = this._shader;
			let e = t.texture, n = e.source;
			r.resources.uTexture = n, r.resources.uSampler = n.style, r.resources.textureUniforms.uniforms.uTextureMatrix = e.textureMatrix.mapCoord;
		} else if (!r.glProgram) {
			w("Mesh shader has no glProgram", t.shader);
			return;
		}
		r.groups[100] = n.globalUniforms.bindGroup, r.groups[101] = e.localUniformsBindGroup, n.encoder.draw({
			geometry: t._geometry,
			shader: r,
			state: t.state
		});
	}
	destroy() {
		this._shader.destroy(!0), this._shader = null;
	}
};
so.extension = {
	type: [D.WebGLPipesAdaptor],
	name: "mesh"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/WebGLRenderer.mjs
var co = /* @__PURE__ */ s({ WebGLRenderer: () => go }), lo = [
	...ve,
	ra,
	qi,
	Li,
	Xi,
	Fi,
	ao,
	aa,
	Wi,
	Da,
	Ca,
	Yi,
	Ia,
	Qi,
	Ji
], uo = [...ge], fo = [
	Zr,
	so,
	oo
], po = [], mo = [], ho = [];
e.handleByNamedList(D.WebGLSystem, po), e.handleByNamedList(D.WebGLPipes, mo), e.handleByNamedList(D.WebGLPipesAdaptor, ho), e.add(...lo, ...uo, ...fo);
var go = class extends pe {
	constructor() {
		let e = {
			name: "webgl",
			type: c.WEBGL,
			systems: po,
			renderPipes: mo,
			renderPipeAdaptors: ho
		};
		super(e);
	}
}, _o = class {
	constructor(e) {
		this._hash = /* @__PURE__ */ Object.create(null), this._renderer = e;
	}
	contextChange(e) {
		this._gpu = e;
	}
	getBindGroup(e, t, n) {
		return e._updateKey(), this._hash[e._key] || this._createBindGroup(e, t, n);
	}
	_createBindGroup(e, t, n) {
		let r = this._gpu.device, i = t.layout[n], a = [], o = this._renderer;
		for (let t in i) {
			let n = e.resources[t] ?? e.resources[i[t]], r;
			if (n._resourceType === "uniformGroup") {
				let e = n;
				o.ubo.updateUniformGroup(e);
				let t = e.buffer;
				r = {
					buffer: o.buffer.getGPUBuffer(t),
					offset: 0,
					size: t.descriptor.size
				};
			} else if (n._resourceType === "buffer") {
				let e = n;
				r = {
					buffer: o.buffer.getGPUBuffer(e),
					offset: 0,
					size: e.descriptor.size
				};
			} else if (n._resourceType === "bufferResource") {
				let e = n;
				r = {
					buffer: o.buffer.getGPUBuffer(e.buffer),
					offset: e.offset,
					size: e.size
				};
			} else if (n._resourceType === "textureSampler") {
				let e = n;
				r = o.texture.getGpuSampler(e);
			} else if (n._resourceType === "textureSource") {
				let e = n;
				r = o.texture.getTextureView(e);
			}
			a.push({
				binding: i[t],
				resource: r
			});
		}
		let s = o.shader.getProgramData(t).bindGroups[n], c = r.createBindGroup({
			layout: s,
			entries: a
		});
		return this._hash[e._key] = c, c;
	}
	destroy() {
		this._hash = null, this._renderer = null;
	}
};
_o.extension = {
	type: [D.WebGPUSystem],
	name: "bindGroup"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gpu/buffer/GpuBufferSystem.mjs
var vo = class {
	constructor(e) {
		this.gpuBuffer = e;
	}
	destroy() {
		this.gpuBuffer.destroy(), this.gpuBuffer = null;
	}
}, yo = class {
	constructor(e) {
		this._renderer = e, this._managedBuffers = new V({
			renderer: e,
			type: "resource",
			onUnload: this.onBufferUnload.bind(this),
			name: "gpuBuffer"
		});
	}
	contextChange(e) {
		this._gpu = e;
	}
	getGPUBuffer(e) {
		return e._gcLastUsed = this._renderer.gc.now, e._gpuData[this._renderer.uid]?.gpuBuffer || this.createGPUBuffer(e);
	}
	updateBuffer(e) {
		let t = this.getGPUBuffer(e), n = e.data;
		return e._updateID && n && (e._updateID = 0, this._gpu.device.queue.writeBuffer(t, 0, n.buffer, 0, (e._updateSize || n.byteLength) + 3 & -4)), t;
	}
	destroyAll() {
		this._managedBuffers.removeAll();
	}
	onBufferUnload(e) {
		e.off("update", this.updateBuffer, this), e.off("change", this.onBufferChange, this);
	}
	createGPUBuffer(e) {
		let t = this._gpu.device.createBuffer(e.descriptor);
		return e._updateID = 0, e._resourceId = p("resource"), e.data && (Oe(e.data.buffer, t.getMappedRange(), e.data.byteOffset, e.data.byteLength), t.unmap()), e._gpuData[this._renderer.uid] = new vo(t), this._managedBuffers.add(e) && (e.on("update", this.updateBuffer, this), e.on("change", this.onBufferChange, this)), t;
	}
	onBufferChange(e) {
		this._managedBuffers.remove(e), e._updateID = 0, this.createGPUBuffer(e);
	}
	destroy() {
		this._managedBuffers.destroy(), this._renderer = null, this._gpu = null;
	}
};
yo.extension = {
	type: [D.WebGPUSystem],
	name: "buffer"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gpu/buffer/UboBatch.mjs
var bo = class {
	constructor({ minUniformOffsetAlignment: e }) {
		this._minUniformOffsetAlignment = 256, this.byteIndex = 0, this._minUniformOffsetAlignment = e, this.data = /* @__PURE__ */ new Float32Array(65535);
	}
	clear() {
		this.byteIndex = 0;
	}
	addEmptyGroup(e) {
		if (e > this._minUniformOffsetAlignment / 4) throw Error(`UniformBufferBatch: array is too large: ${e * 4}`);
		let t = this.byteIndex, n = t + e * 4;
		if (n = Math.ceil(n / this._minUniformOffsetAlignment) * this._minUniformOffsetAlignment, n > this.data.length * 4) throw Error("UniformBufferBatch: ubo batch got too big");
		return this.byteIndex = n, t;
	}
	addGroup(e) {
		let t = this.addEmptyGroup(e.length);
		for (let n = 0; n < e.length; n++) this.data[t / 4 + n] = e[n];
		return t;
	}
	destroy() {
		this.data = null;
	}
}, xo = class {
	constructor(e) {
		this._colorMaskCache = 15, this._renderer = e;
	}
	setMask(e) {
		this._colorMaskCache !== e && (this._colorMaskCache = e, this._renderer.pipeline.setColorMask(e));
	}
	destroy() {
		this._renderer = null, this._colorMaskCache = null;
	}
};
xo.extension = {
	type: [D.WebGPUSystem],
	name: "colorMask"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gpu/GpuDeviceSystem.mjs
var So = class {
	constructor(e) {
		this._renderer = e;
	}
	async init(e) {
		return this._initPromise ||= (e.gpu ? Promise.resolve(e.gpu) : this._createDeviceAndAdaptor(e)).then((e) => {
			this.gpu = e, this.extensions = { transientAttachment: typeof GPUTextureUsage.TRANSIENT_ATTACHMENT == "number" }, this._renderer.runners.contextChange.emit(this.gpu);
		}), this._initPromise;
	}
	contextChange(e) {
		this._renderer.gpu = e;
	}
	async _createDeviceAndAdaptor(e) {
		let t = await y.get().getNavigator().gpu.requestAdapter({
			powerPreference: e.powerPreference,
			forceFallbackAdapter: e.forceFallbackAdapter
		}), n = [
			"texture-compression-bc",
			"texture-compression-astc",
			"texture-compression-etc2"
		].filter((e) => t.features.has(e));
		return {
			adapter: t,
			device: await t.requestDevice({ requiredFeatures: n })
		};
	}
	destroy() {
		this.gpu = null, this.extensions = null, this._renderer = null;
	}
};
So.extension = {
	type: [D.WebGPUSystem],
	name: "device"
}, So.defaultOptions = {
	powerPreference: void 0,
	forceFallbackAdapter: !1
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gpu/GpuEncoderSystem.mjs
var Co = class {
	constructor(e) {
		this._boundBindGroup = /* @__PURE__ */ Object.create(null), this._boundVertexBuffer = /* @__PURE__ */ Object.create(null), this._renderer = e;
	}
	renderStart() {
		this.commandFinished = new Promise((e) => {
			this._resolveCommandFinished = e;
		}), this.commandEncoder = this._renderer.gpu.device.createCommandEncoder();
	}
	beginRenderPass(e) {
		this.endRenderPass(), this._clearCache(), this.renderPassEncoder = this.commandEncoder.beginRenderPass(e.descriptor);
	}
	endRenderPass() {
		this.renderPassEncoder && this.renderPassEncoder.end(), this.renderPassEncoder = null;
	}
	setViewport(e) {
		this.renderPassEncoder.setViewport(e.x, e.y, e.width, e.height, 0, 1);
	}
	setPipelineFromGeometryProgramAndState(e, t, n, r) {
		let i = this._renderer.pipeline.getPipeline(e, t, n, r);
		this.setPipeline(i);
	}
	setPipeline(e) {
		this._boundPipeline !== e && (this._boundPipeline = e, this.renderPassEncoder.setPipeline(e));
	}
	_setVertexBuffer(e, t) {
		this._boundVertexBuffer[e] !== t && (this._boundVertexBuffer[e] = t, this.renderPassEncoder.setVertexBuffer(e, this._renderer.buffer.updateBuffer(t)));
	}
	_setIndexBuffer(e) {
		if (this._boundIndexBuffer === e) return;
		this._boundIndexBuffer = e;
		let t = e.data.BYTES_PER_ELEMENT === 2 ? "uint16" : "uint32";
		this.renderPassEncoder.setIndexBuffer(this._renderer.buffer.updateBuffer(e), t);
	}
	resetBindGroup(e) {
		this._boundBindGroup[e] = null;
	}
	setBindGroup(e, t, n) {
		if (this._boundBindGroup[e] === t) return;
		this._boundBindGroup[e] = t, t._touch(this._renderer.gc.now, this._renderer.tick);
		let r = this._renderer.bindGroup.getBindGroup(t, n, e);
		this.renderPassEncoder.setBindGroup(e, r);
	}
	setGeometry(e, t) {
		let n = this._renderer.pipeline.getBufferNamesToBind(e, t);
		for (let t in n) this._setVertexBuffer(parseInt(t, 10), e.attributes[n[t]].buffer);
		e.indexBuffer && this._setIndexBuffer(e.indexBuffer);
	}
	_setShaderBindGroups(e, t) {
		for (let n in e.groups) {
			let r = e.groups[n];
			t || this._syncBindGroup(r), this.setBindGroup(n, r, e.gpuProgram);
		}
	}
	_syncBindGroup(e) {
		for (let t in e.resources) {
			let n = e.resources[t];
			n.isUniformGroup && this._renderer.ubo.updateUniformGroup(n);
		}
	}
	draw(e) {
		let { geometry: t, shader: n, state: r, topology: i, size: a, start: o, instanceCount: s, skipSync: c } = e;
		this.setPipelineFromGeometryProgramAndState(t, n.gpuProgram, r, i), this.setGeometry(t, n.gpuProgram), this._setShaderBindGroups(n, c), t.indexBuffer ? this.renderPassEncoder.drawIndexed(a || t.indexBuffer.data.length, s ?? t.instanceCount, o || 0) : this.renderPassEncoder.draw(a || t.getSize(), s ?? t.instanceCount, o || 0);
	}
	finishRenderPass() {
		this.renderPassEncoder &&= (this.renderPassEncoder.end(), null);
	}
	postrender() {
		this.finishRenderPass(), this._gpu.device.queue.submit([this.commandEncoder.finish()]), this._resolveCommandFinished(), this.commandEncoder = null;
	}
	restoreRenderPass() {
		let e = this._renderer.renderTarget.adaptor.getDescriptor(this._renderer.renderTarget.renderTarget, !1, [
			0,
			0,
			0,
			1
		], this._renderer.renderTarget.mipLevel, this._renderer.renderTarget.layer);
		this.renderPassEncoder = this.commandEncoder.beginRenderPass(e);
		let t = this._boundPipeline, n = { ...this._boundVertexBuffer }, r = this._boundIndexBuffer, i = { ...this._boundBindGroup };
		this._clearCache();
		let a = this._renderer.renderTarget.viewport;
		this.renderPassEncoder.setViewport(a.x, a.y, a.width, a.height, 0, 1), this.setPipeline(t);
		for (let e in n) this._setVertexBuffer(e, n[e]);
		for (let e in i) this.setBindGroup(e, i[e], null);
		this._setIndexBuffer(r);
	}
	_clearCache() {
		for (let e = 0; e < 16; e++) this._boundBindGroup[e] = null, this._boundVertexBuffer[e] = null;
		this._boundIndexBuffer = null, this._boundPipeline = null;
	}
	destroy() {
		this._renderer = null, this._gpu = null, this._boundBindGroup = null, this._boundVertexBuffer = null, this._boundIndexBuffer = null, this._boundPipeline = null;
	}
	contextChange(e) {
		this._gpu = e;
	}
};
Co.extension = {
	type: [D.WebGPUSystem],
	name: "encoder",
	priority: 1
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gpu/GpuLimitsSystem.mjs
var wo = class {
	constructor(e) {
		this._renderer = e;
	}
	contextChange() {
		this.maxTextures = this._renderer.device.gpu.device.limits.maxSampledTexturesPerShaderStage, this.maxBatchableTextures = this.maxTextures;
	}
	destroy() {}
};
wo.extension = {
	type: [D.WebGPUSystem],
	name: "limits"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gpu/GpuStencilSystem.mjs
var To = class {
	constructor(e) {
		this._renderTargetStencilState = /* @__PURE__ */ Object.create(null), this._renderer = e, e.renderTarget.onRenderTargetChange.add(this);
	}
	onRenderTargetChange(e) {
		let t = this._renderTargetStencilState[e.uid];
		t ||= this._renderTargetStencilState[e.uid] = {
			stencilMode: B.DISABLED,
			stencilReference: 0
		}, this._activeRenderTarget = e, this.setStencilMode(t.stencilMode, t.stencilReference);
	}
	setStencilMode(e, t) {
		let n = this._renderTargetStencilState[this._activeRenderTarget.uid];
		n.stencilMode = e, n.stencilReference = t;
		let r = this._renderer;
		r.pipeline.setStencilMode(e), r.encoder.renderPassEncoder.setStencilReference(t);
	}
	destroy() {
		this._renderer.renderTarget.onRenderTargetChange.remove(this), this._renderer = null, this._activeRenderTarget = null, this._renderTargetStencilState = null;
	}
};
To.extension = {
	type: [D.WebGPUSystem],
	name: "stencil"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gpu/shader/utils/createUboElementsWGSL.mjs
var Eo = {
	i32: {
		align: 4,
		size: 4
	},
	u32: {
		align: 4,
		size: 4
	},
	f32: {
		align: 4,
		size: 4
	},
	f16: {
		align: 2,
		size: 2
	},
	"vec2<i32>": {
		align: 8,
		size: 8
	},
	"vec2<u32>": {
		align: 8,
		size: 8
	},
	"vec2<f32>": {
		align: 8,
		size: 8
	},
	"vec2<f16>": {
		align: 4,
		size: 4
	},
	"vec3<i32>": {
		align: 16,
		size: 12
	},
	"vec3<u32>": {
		align: 16,
		size: 12
	},
	"vec3<f32>": {
		align: 16,
		size: 12
	},
	"vec3<f16>": {
		align: 8,
		size: 6
	},
	"vec4<i32>": {
		align: 16,
		size: 16
	},
	"vec4<u32>": {
		align: 16,
		size: 16
	},
	"vec4<f32>": {
		align: 16,
		size: 16
	},
	"vec4<f16>": {
		align: 8,
		size: 8
	},
	"mat2x2<f32>": {
		align: 8,
		size: 16
	},
	"mat2x2<f16>": {
		align: 4,
		size: 8
	},
	"mat3x2<f32>": {
		align: 8,
		size: 24
	},
	"mat3x2<f16>": {
		align: 4,
		size: 12
	},
	"mat4x2<f32>": {
		align: 8,
		size: 32
	},
	"mat4x2<f16>": {
		align: 4,
		size: 16
	},
	"mat2x3<f32>": {
		align: 16,
		size: 32
	},
	"mat2x3<f16>": {
		align: 8,
		size: 16
	},
	"mat3x3<f32>": {
		align: 16,
		size: 48
	},
	"mat3x3<f16>": {
		align: 8,
		size: 24
	},
	"mat4x3<f32>": {
		align: 16,
		size: 64
	},
	"mat4x3<f16>": {
		align: 8,
		size: 32
	},
	"mat2x4<f32>": {
		align: 16,
		size: 32
	},
	"mat2x4<f16>": {
		align: 8,
		size: 16
	},
	"mat3x4<f32>": {
		align: 16,
		size: 48
	},
	"mat3x4<f16>": {
		align: 8,
		size: 24
	},
	"mat4x4<f32>": {
		align: 16,
		size: 64
	},
	"mat4x4<f16>": {
		align: 8,
		size: 32
	}
};
function Do(e) {
	let t = e.map((e) => ({
		data: e,
		offset: 0,
		size: 0
	})), n = 0;
	for (let e = 0; e < t.length; e++) {
		let r = t[e], i = Eo[r.data.type].size, a = Eo[r.data.type].align;
		if (!Eo[r.data.type]) throw Error(`[Pixi.js] WebGPU UniformBuffer: Unknown type ${r.data.type}`);
		r.data.size > 1 && (i = Math.max(i, a) * r.data.size), n = Math.ceil(n / a) * a, r.size = i, r.offset = n, n += i;
	}
	return n = Math.ceil(n / 16) * 16, {
		uboElements: t,
		size: n
	};
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gpu/shader/utils/generateArraySyncWGSL.mjs
function Oo(e, t) {
	let { size: n, align: r } = Eo[e.data.type], i = (r - n) / 4, a = e.data.type.indexOf("i32") >= 0 ? "dataInt32" : "data";
	return `
         v = uv.${e.data.name};
         ${t === 0 ? "" : `offset += ${t};`}

         arrayOffset = offset;

         t = 0;

         for(var i=0; i < ${e.data.size * (n / 4)}; i++)
         {
             for(var j = 0; j < ${n / 4}; j++)
             {
                 ${a}[arrayOffset++] = v[t++];
             }
             ${i === 0 ? "" : `arrayOffset += ${i};`}
         }
     `;
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gpu/shader/utils/createUboSyncFunctionWGSL.mjs
function ko(e) {
	return Je(e, "uboWgsl", Oo, $e);
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gpu/GpuUboSystem.mjs
var Ao = class extends Ze {
	constructor() {
		super({
			createUboElements: Do,
			generateUboSync: ko
		});
	}
};
Ao.extension = {
	type: [D.WebGPUSystem],
	name: "ubo"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gpu/GpuUniformBatchPipe.mjs
var Z = 128, jo = class {
	constructor(e) {
		this._bindGroupHash = /* @__PURE__ */ Object.create(null), this._buffers = [], this._bindGroups = [], this._bufferResources = [], this._renderer = e, this._batchBuffer = new bo({ minUniformOffsetAlignment: Z });
		let t = 256 / Z;
		for (let e = 0; e < t; e++) {
			let t = b.UNIFORM | b.COPY_DST;
			e === 0 && (t |= b.COPY_SRC), this._buffers.push(new _({
				data: this._batchBuffer.data,
				usage: t
			}));
		}
	}
	renderEnd() {
		this._uploadBindGroups(), this._resetBindGroups();
	}
	_resetBindGroups() {
		this._bindGroupHash = /* @__PURE__ */ Object.create(null), this._batchBuffer.clear();
	}
	getUniformBindGroup(e, t) {
		if (!t && this._bindGroupHash[e.uid]) return this._bindGroupHash[e.uid];
		this._renderer.ubo.ensureUniformGroup(e);
		let n = e.buffer.data, r = this._batchBuffer.addEmptyGroup(n.length);
		return this._renderer.ubo.syncUniformGroup(e, this._batchBuffer.data, r / 4), this._bindGroupHash[e.uid] = this._getBindGroup(r / Z), this._bindGroupHash[e.uid];
	}
	getUboResource(e) {
		this._renderer.ubo.updateUniformGroup(e);
		let t = e.buffer.data, n = this._batchBuffer.addGroup(t);
		return this._getBufferResource(n / Z);
	}
	getArrayBindGroup(e) {
		let t = this._batchBuffer.addGroup(e);
		return this._getBindGroup(t / Z);
	}
	getArrayBufferResource(e) {
		let t = this._batchBuffer.addGroup(e) / Z;
		return this._getBufferResource(t);
	}
	_getBufferResource(e) {
		if (!this._bufferResources[e]) {
			let t = this._buffers[e % 2];
			this._bufferResources[e] = new tt({
				buffer: t,
				offset: (e / 2 | 0) * 256,
				size: Z
			});
		}
		return this._bufferResources[e];
	}
	_getBindGroup(e) {
		if (!this._bindGroups[e]) {
			let t = new v({ 0: this._getBufferResource(e) });
			this._bindGroups[e] = t;
		}
		return this._bindGroups[e];
	}
	_uploadBindGroups() {
		let e = this._renderer.buffer, t = this._buffers[0];
		t.update(this._batchBuffer.byteIndex), e.updateBuffer(t);
		let n = this._renderer.gpu.device.createCommandEncoder();
		for (let r = 1; r < this._buffers.length; r++) {
			let i = this._buffers[r];
			n.copyBufferToBuffer(e.getGPUBuffer(t), Z, e.getGPUBuffer(i), 0, this._batchBuffer.byteIndex);
		}
		this._renderer.gpu.device.queue.submit([n.finish()]);
	}
	destroy() {
		for (let e = 0; e < this._bindGroups.length; e++) this._bindGroups[e]?.destroy();
		this._bindGroups = null, this._bindGroupHash = null;
		for (let e = 0; e < this._buffers.length; e++) this._buffers[e].destroy();
		this._buffers = null;
		for (let e = 0; e < this._bufferResources.length; e++) this._bufferResources[e].destroy();
		this._bufferResources = null, this._batchBuffer.destroy(), this._renderer = null;
	}
};
jo.extension = {
	type: [D.WebGPUPipes],
	name: "uniformBatch"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gpu/pipeline/PipelineSystem.mjs
var Mo = {
	"point-list": 0,
	"line-list": 1,
	"line-strip": 2,
	"triangle-list": 3,
	"triangle-strip": 4
};
function No(e, t, n, r, i) {
	return e << 24 | t << 16 | n << 10 | r << 5 | i;
}
function Po(e, t, n, r, i) {
	return n << 8 | e << 5 | r << 3 | i << 1 | t;
}
var Fo = class {
	constructor(e) {
		this._moduleCache = /* @__PURE__ */ Object.create(null), this._bufferLayoutsCache = /* @__PURE__ */ Object.create(null), this._bindingNamesCache = /* @__PURE__ */ Object.create(null), this._pipeCache = /* @__PURE__ */ Object.create(null), this._pipeStateCaches = /* @__PURE__ */ Object.create(null), this._colorMask = 15, this._multisampleCount = 1, this._colorTargetCount = 1, this._renderer = e;
	}
	contextChange(e) {
		this._gpu = e, this.setStencilMode(B.DISABLED), this._updatePipeHash();
	}
	setMultisampleCount(e) {
		this._multisampleCount !== e && (this._multisampleCount = e, this._updatePipeHash());
	}
	setRenderTarget(e) {
		this._multisampleCount = e.msaaSamples, this._depthStencilAttachment = +!!e.descriptor.depthStencilAttachment, this._colorTargetCount = e.colorTargetCount, this._updatePipeHash();
	}
	setColorMask(e) {
		this._colorMask !== e && (this._colorMask = e, this._updatePipeHash());
	}
	setStencilMode(e) {
		this._stencilMode !== e && (this._stencilMode = e, this._stencilState = et[e], this._updatePipeHash());
	}
	setPipeline(e, t, n, r) {
		let i = this.getPipeline(e, t, n);
		r.setPipeline(i);
	}
	getPipeline(e, t, n, r) {
		e._layoutKey || (Ge(e, t.attributeData), this._generateBufferKey(e)), r ||= e.topology;
		let i = No(e._layoutKey, t._layoutKey, n.data, n._blendModeId, Mo[r]);
		return this._pipeCache[i] || (this._pipeCache[i] = this._createPipeline(e, t, n, r)), this._pipeCache[i];
	}
	_createPipeline(e, t, n, r) {
		let i = this._gpu.device, a = this._createVertexBufferLayouts(e, t), o = this._renderer.state.getColorTargets(n, this._colorTargetCount), s = this._stencilMode === B.RENDERING_MASK_ADD ? 0 : this._colorMask;
		for (let e = 0; e < o.length; e++) o[e].writeMask = s;
		let c = this._renderer.shader.getProgramData(t).pipeline, l = {
			vertex: {
				module: this._getModule(t.vertex.source),
				entryPoint: t.vertex.entryPoint,
				buffers: a
			},
			fragment: {
				module: this._getModule(t.fragment.source),
				entryPoint: t.fragment.entryPoint,
				targets: o
			},
			primitive: {
				topology: r,
				cullMode: n.cullMode
			},
			layout: c,
			multisample: { count: this._multisampleCount },
			label: "PIXI Pipeline"
		};
		return this._depthStencilAttachment && (l.depthStencil = {
			...this._stencilState,
			format: "depth24plus-stencil8",
			depthWriteEnabled: n.depthTest,
			depthCompare: n.depthTest ? "less" : "always"
		}), i.createRenderPipeline(l);
	}
	_getModule(e) {
		return this._moduleCache[e] || this._createModule(e);
	}
	_createModule(e) {
		let t = this._gpu.device;
		return this._moduleCache[e] = t.createShaderModule({ code: e }), this._moduleCache[e];
	}
	_generateBufferKey(e) {
		let t = [], n = 0, r = Object.keys(e.attributes).sort();
		for (let i = 0; i < r.length; i++) {
			let a = e.attributes[r[i]];
			t[n++] = a.offset, t[n++] = a.format, t[n++] = a.stride, t[n++] = a.instance;
		}
		return e._layoutKey = l(t.join("|"), "geometry"), e._layoutKey;
	}
	_generateAttributeLocationsKey(e) {
		let t = [], n = 0, r = Object.keys(e.attributeData).sort();
		for (let i = 0; i < r.length; i++) {
			let a = e.attributeData[r[i]];
			t[n++] = a.location;
		}
		return e._attributeLocationsKey = l(t.join("|"), "programAttributes"), e._attributeLocationsKey;
	}
	getBufferNamesToBind(e, t) {
		let n = e._layoutKey << 16 | t._attributeLocationsKey;
		if (this._bindingNamesCache[n]) return this._bindingNamesCache[n];
		let r = this._createVertexBufferLayouts(e, t), i = /* @__PURE__ */ Object.create(null), a = t.attributeData;
		for (let e = 0; e < r.length; e++) {
			let t = Object.values(r[e].attributes)[0].shaderLocation;
			for (let n in a) if (a[n].location === t) {
				i[e] = n;
				break;
			}
		}
		return this._bindingNamesCache[n] = i, i;
	}
	_createVertexBufferLayouts(e, t) {
		t._attributeLocationsKey || this._generateAttributeLocationsKey(t);
		let n = e._layoutKey << 16 | t._attributeLocationsKey;
		if (this._bufferLayoutsCache[n]) return this._bufferLayoutsCache[n];
		let r = [];
		return e.buffers.forEach((n) => {
			let i = {
				arrayStride: 0,
				stepMode: "vertex",
				attributes: []
			}, a = i.attributes;
			for (let r in t.attributeData) {
				let o = e.attributes[r];
				(o.divisor ?? 1) !== 1 && w(`Attribute ${r} has an invalid divisor value of '${o.divisor}'. WebGPU only supports a divisor value of 1`), o.buffer === n && (i.arrayStride = o.stride, i.stepMode = o.instance ? "instance" : "vertex", a.push({
					shaderLocation: t.attributeData[r].location,
					offset: o.offset,
					format: o.format
				}));
			}
			a.length && r.push(i);
		}), this._bufferLayoutsCache[n] = r, r;
	}
	_updatePipeHash() {
		let e = Po(this._stencilMode, this._multisampleCount, this._colorMask, this._depthStencilAttachment, this._colorTargetCount);
		this._pipeStateCaches[e] || (this._pipeStateCaches[e] = /* @__PURE__ */ Object.create(null)), this._pipeCache = this._pipeStateCaches[e];
	}
	destroy() {
		this._renderer = null, this._bufferLayoutsCache = null;
	}
};
Fo.extension = {
	type: [D.WebGPUSystem],
	name: "pipeline"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gpu/renderTarget/GpuRenderTarget.mjs
var Io = class {
	constructor() {
		this.contexts = [], this.msaaTextures = [], this.msaaSamples = 1;
	}
}, Lo = class {
	init(e, t) {
		this._renderer = e, this._renderTargetSystem = t;
	}
	copyToTexture(e, t, n, r, i) {
		let a = this._renderer, o = this._getGpuColorTexture(e), s = a.texture.getGpuSource(t.source);
		return a.encoder.commandEncoder.copyTextureToTexture({
			texture: o,
			origin: n
		}, {
			texture: s,
			origin: i
		}, r), t;
	}
	startRenderPass(e, t = !0, n, r, i = 0, a = 0) {
		let o = this._renderTargetSystem.getGpuRenderTarget(e);
		if (a !== 0 && o.msaaTextures?.length) throw Error("[RenderTargetSystem] Rendering to array layers is not supported with MSAA render targets.");
		if (i > 0 && o.msaaTextures?.length) throw Error("[RenderTargetSystem] Rendering to mip levels is not supported with MSAA render targets.");
		o.descriptor = this.getDescriptor(e, t, n, i, a), this._renderer.pipeline.setRenderTarget(o), this._renderer.encoder.beginRenderPass(o), this._renderer.encoder.setViewport(r);
	}
	finishRenderPass() {
		this._renderer.encoder.endRenderPass();
	}
	_getGpuColorTexture(e) {
		let t = this._renderTargetSystem.getGpuRenderTarget(e);
		return t.contexts[0] ? t.contexts[0].getCurrentTexture() : this._renderer.texture.getGpuSource(e.colorTextures[0].source);
	}
	getDescriptor(e, t, n, r = 0, i = 0) {
		typeof t == "boolean" && (t = t ? z.ALL : z.NONE);
		let a = this._renderTargetSystem, o = a.getGpuRenderTarget(e), s = e.colorTextures.map((e, s) => {
			let c = o.contexts[s], l, u;
			if (c) {
				if (i !== 0) throw Error("[RenderTargetSystem] Rendering to array layers is not supported for canvas targets.");
				l = c.getCurrentTexture().createView();
			} else l = this._renderer.texture.getGpuSource(e).createView({
				dimension: "2d",
				baseMipLevel: r,
				mipLevelCount: 1,
				baseArrayLayer: i,
				arrayLayerCount: 1
			});
			let d = !1;
			o.msaaTextures[s] && (u = l, l = this._renderer.texture.getTextureView(o.msaaTextures[s]), d = o.msaaTextures[s].transient);
			let f = t & z.COLOR ? "clear" : "load";
			return n ??= a.defaultClearColor, {
				view: l,
				resolveTarget: u,
				clearValue: n,
				storeOp: d ? "discard" : "store",
				loadOp: f
			};
		}), c;
		if ((e.stencil || e.depth) && !e.depthStencilTexture && (e.ensureDepthStencilTexture(), e.depthStencilTexture.source.sampleCount = o.msaa ? 4 : 1, e.depthStencilTexture.source.transient = !!o.msaaTextures[0]?.transient), e.depthStencilTexture) {
			let n = t & z.STENCIL ? "clear" : "load", a = t & z.DEPTH ? "clear" : "load", o = e.depthStencilTexture.source.transient ? "discard" : "store";
			c = {
				view: this._renderer.texture.getGpuSource(e.depthStencilTexture.source).createView({
					dimension: "2d",
					baseMipLevel: r,
					mipLevelCount: 1,
					baseArrayLayer: i,
					arrayLayerCount: 1
				}),
				stencilStoreOp: o,
				stencilLoadOp: n,
				depthClearValue: 1,
				depthLoadOp: a,
				depthStoreOp: o
			};
		}
		return {
			colorAttachments: s,
			depthStencilAttachment: c
		};
	}
	clear(e, t = !0, n, r, i = 0, a = 0) {
		if (!t) return;
		let { gpu: o, encoder: s } = this._renderer, c = o.device;
		if (s.commandEncoder === null) {
			let o = c.createCommandEncoder(), s = this.getDescriptor(e, t, n, i, a), l = o.beginRenderPass(s);
			l.setViewport(r.x, r.y, r.width, r.height, 0, 1), l.end();
			let u = o.finish();
			c.queue.submit([u]);
		} else this.startRenderPass(e, t, n, r, i, a);
	}
	initGpuRenderTarget(e) {
		e.isRoot = !0;
		let t = new Io();
		return t.colorTargetCount = e.colorTextures.length, e.colorTextures.forEach((e, n) => {
			if (e instanceof O) {
				let r = e.resource.getContext("webgpu"), i = e.transparent ? "premultiplied" : "opaque";
				try {
					r.configure({
						device: this._renderer.gpu.device,
						usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
						format: "bgra8unorm",
						alphaMode: i
					});
				} catch (e) {
					console.error(e);
				}
				t.contexts[n] = r;
			}
			if (t.msaa = e.source.antialias, e.source.antialias) {
				let r = new ee({
					width: 0,
					height: 0,
					sampleCount: 4,
					transient: e.source.transient,
					arrayLayerCount: e.source.arrayLayerCount
				});
				t.msaaTextures[n] = r;
			}
		}), t.msaa && (t.msaaSamples = 4, e.depthStencilTexture && (e.depthStencilTexture.source.sampleCount = 4, e.depthStencilTexture.source.transient = !!t.msaaTextures[0]?.transient)), t;
	}
	destroyGpuRenderTarget(e) {
		e.contexts.forEach((e) => {
			e.unconfigure();
		}), e.msaaTextures.forEach((e) => {
			e.destroy();
		}), e.msaaTextures.length = 0, e.contexts.length = 0;
	}
	ensureDepthStencilTexture(e) {
		let t = this._renderTargetSystem.getGpuRenderTarget(e);
		e.depthStencilTexture && t.msaa && (e.depthStencilTexture.source.sampleCount = 4);
	}
	resizeGpuRenderTarget(e) {
		let t = this._renderTargetSystem.getGpuRenderTarget(e);
		t.width = e.width, t.height = e.height, t.msaa && e.colorTextures.forEach((e, n) => {
			t.msaaTextures[n]?.resize(e.source.width, e.source.height, e.source._resolution);
		});
	}
}, Ro = class extends be {
	constructor(e) {
		super(e), this.adaptor = new Lo(), this.adaptor.init(e, this);
	}
};
Ro.extension = {
	type: [D.WebGPUSystem],
	name: "renderTarget"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gpu/shader/GpuShaderSystem.mjs
var zo = class {
	constructor() {
		this._gpuProgramData = /* @__PURE__ */ Object.create(null);
	}
	contextChange(e) {
		this._gpu = e;
	}
	getProgramData(e) {
		return this._gpuProgramData[e._layoutKey] || this._createGPUProgramData(e);
	}
	_createGPUProgramData(e) {
		let t = this._gpu.device, n = e.gpuLayout.map((e) => t.createBindGroupLayout({ entries: e })), r = { bindGroupLayouts: n };
		return this._gpuProgramData[e._layoutKey] = {
			bindGroups: n,
			pipeline: t.createPipelineLayout(r)
		}, this._gpuProgramData[e._layoutKey];
	}
	destroy() {
		this._gpu = null, this._gpuProgramData = null;
	}
};
zo.extension = {
	type: [D.WebGPUSystem],
	name: "shader"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gpu/state/GpuBlendModesToPixi.mjs
var Q = {};
Q.normal = {
	alpha: {
		srcFactor: "one",
		dstFactor: "one-minus-src-alpha",
		operation: "add"
	},
	color: {
		srcFactor: "one",
		dstFactor: "one-minus-src-alpha",
		operation: "add"
	}
}, Q.add = {
	alpha: {
		srcFactor: "src-alpha",
		dstFactor: "one-minus-src-alpha",
		operation: "add"
	},
	color: {
		srcFactor: "one",
		dstFactor: "one",
		operation: "add"
	}
}, Q.multiply = {
	alpha: {
		srcFactor: "one",
		dstFactor: "one-minus-src-alpha",
		operation: "add"
	},
	color: {
		srcFactor: "dst",
		dstFactor: "one-minus-src-alpha",
		operation: "add"
	}
}, Q.screen = {
	alpha: {
		srcFactor: "one",
		dstFactor: "one-minus-src-alpha",
		operation: "add"
	},
	color: {
		srcFactor: "one",
		dstFactor: "one-minus-src",
		operation: "add"
	}
}, Q.overlay = {
	alpha: {
		srcFactor: "one",
		dstFactor: "one-minus-src-alpha",
		operation: "add"
	},
	color: {
		srcFactor: "one",
		dstFactor: "one-minus-src",
		operation: "add"
	}
}, Q.none = {
	alpha: {
		srcFactor: "one",
		dstFactor: "one-minus-src-alpha",
		operation: "add"
	},
	color: {
		srcFactor: "zero",
		dstFactor: "zero",
		operation: "add"
	}
}, Q["normal-npm"] = {
	alpha: {
		srcFactor: "one",
		dstFactor: "one-minus-src-alpha",
		operation: "add"
	},
	color: {
		srcFactor: "src-alpha",
		dstFactor: "one-minus-src-alpha",
		operation: "add"
	}
}, Q["add-npm"] = {
	alpha: {
		srcFactor: "one",
		dstFactor: "one",
		operation: "add"
	},
	color: {
		srcFactor: "src-alpha",
		dstFactor: "one",
		operation: "add"
	}
}, Q["screen-npm"] = {
	alpha: {
		srcFactor: "one",
		dstFactor: "one-minus-src-alpha",
		operation: "add"
	},
	color: {
		srcFactor: "src-alpha",
		dstFactor: "one-minus-src",
		operation: "add"
	}
}, Q.erase = {
	alpha: {
		srcFactor: "zero",
		dstFactor: "one-minus-src-alpha",
		operation: "add"
	},
	color: {
		srcFactor: "zero",
		dstFactor: "one-minus-src",
		operation: "add"
	}
}, Q.min = {
	alpha: {
		srcFactor: "one",
		dstFactor: "one",
		operation: "min"
	},
	color: {
		srcFactor: "one",
		dstFactor: "one",
		operation: "min"
	}
}, Q.max = {
	alpha: {
		srcFactor: "one",
		dstFactor: "one",
		operation: "max"
	},
	color: {
		srcFactor: "one",
		dstFactor: "one",
		operation: "max"
	}
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gpu/state/GpuStateSystem.mjs
var Bo = class {
	constructor() {
		this.defaultState = new k(), this.defaultState.blend = !0;
	}
	contextChange(e) {
		this.gpu = e;
	}
	getColorTargets(e, t) {
		let n = Q[e.blendMode] || Q.normal, r = [], i = {
			format: "bgra8unorm",
			writeMask: 0,
			blend: n
		};
		for (let e = 0; e < t; e++) r[e] = i;
		return r;
	}
	destroy() {
		this.gpu = null;
	}
};
Bo.extension = {
	type: [D.WebGPUSystem],
	name: "state"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gpu/texture/uploaders/gpuUploadBufferImageResource.mjs
var Vo = {
	type: "image",
	upload(e, t, n, r = 0) {
		let i = e.resource, a = (e.pixelWidth | 0) * (e.pixelHeight | 0), o = i.byteLength / a;
		n.device.queue.writeTexture({
			texture: t,
			origin: {
				x: 0,
				y: 0,
				z: r
			}
		}, i, {
			offset: 0,
			rowsPerImage: e.pixelHeight,
			bytesPerRow: e.pixelWidth * o
		}, {
			width: e.pixelWidth,
			height: e.pixelHeight,
			depthOrArrayLayers: 1
		});
	}
}, Ho = {
	"bc1-rgba-unorm": {
		blockBytes: 8,
		blockWidth: 4,
		blockHeight: 4
	},
	"bc2-rgba-unorm": {
		blockBytes: 16,
		blockWidth: 4,
		blockHeight: 4
	},
	"bc3-rgba-unorm": {
		blockBytes: 16,
		blockWidth: 4,
		blockHeight: 4
	},
	"bc7-rgba-unorm": {
		blockBytes: 16,
		blockWidth: 4,
		blockHeight: 4
	},
	"etc1-rgb-unorm": {
		blockBytes: 8,
		blockWidth: 4,
		blockHeight: 4
	},
	"etc2-rgba8unorm": {
		blockBytes: 16,
		blockWidth: 4,
		blockHeight: 4
	},
	"astc-4x4-unorm": {
		blockBytes: 16,
		blockWidth: 4,
		blockHeight: 4
	}
}, Uo = {
	blockBytes: 4,
	blockWidth: 1,
	blockHeight: 1
}, Wo = {
	type: "compressed",
	upload(e, t, n, r = 0) {
		let i = e.pixelWidth, a = e.pixelHeight, o = Ho[e.format] || Uo;
		for (let s = 0; s < e.resource.length; s++) {
			let c = e.resource[s], l = Math.ceil(i / o.blockWidth) * o.blockBytes;
			n.device.queue.writeTexture({
				texture: t,
				mipLevel: s,
				origin: {
					x: 0,
					y: 0,
					z: r
				}
			}, c, {
				offset: 0,
				bytesPerRow: l
			}, {
				width: Math.ceil(i / o.blockWidth) * o.blockWidth,
				height: Math.ceil(a / o.blockHeight) * o.blockHeight,
				depthOrArrayLayers: 1
			}), i = Math.max(i >> 1, 1), a = Math.max(a >> 1, 1);
		}
	}
}, Go = [
	"right",
	"left",
	"top",
	"bottom",
	"front",
	"back"
];
function Ko(e) {
	return {
		type: "cube",
		upload(t, n, r) {
			let i = t.faces;
			for (let t = 0; t < Go.length; t++) {
				let a = i[Go[t]];
				(e[a.uploadMethodId] || e.image).upload(a, n, r, t);
			}
		}
	};
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gpu/texture/uploaders/gpuUploadImageSource.mjs
var qo = {
	type: "image",
	upload(e, t, n, r = 0) {
		let i = e.resource;
		if (!i) return;
		if (globalThis.HTMLImageElement && i instanceof HTMLImageElement) {
			let t = y.get().createCanvas(i.width, i.height);
			t.getContext("2d").drawImage(i, 0, 0, i.width, i.height), e.resource = t, w("ImageSource: Image element passed, converting to canvas and replacing resource.");
		}
		let a = Math.min(t.width, e.resourceWidth || e.pixelWidth), o = Math.min(t.height, e.resourceHeight || e.pixelHeight), s = e.alphaMode === "premultiply-alpha-on-upload";
		n.device.queue.copyExternalImageToTexture({ source: i }, {
			texture: t,
			origin: {
				x: 0,
				y: 0,
				z: r
			},
			premultipliedAlpha: s
		}, {
			width: a,
			height: o
		});
	}
}, Jo = {
	type: "video",
	upload(e, t, n, r) {
		qo.upload(e, t, n, r);
	}
}, Yo = class {
	constructor(e) {
		this.device = e, this.sampler = e.createSampler({ minFilter: "linear" }), this.pipelines = {};
	}
	_getMipmapPipeline(e) {
		let t = this.pipelines[e];
		return t || (this.mipmapShaderModule ||= this.device.createShaderModule({ code: "\n                        var<private> pos : array<vec2<f32>, 3> = array<vec2<f32>, 3>(\n                        vec2<f32>(-1.0, -1.0), vec2<f32>(-1.0, 3.0), vec2<f32>(3.0, -1.0));\n\n                        struct VertexOutput {\n                        @builtin(position) position : vec4<f32>,\n                        @location(0) texCoord : vec2<f32>,\n                        };\n\n                        @vertex\n                        fn vertexMain(@builtin(vertex_index) vertexIndex : u32) -> VertexOutput {\n                        var output : VertexOutput;\n                        output.texCoord = pos[vertexIndex] * vec2<f32>(0.5, -0.5) + vec2<f32>(0.5);\n                        output.position = vec4<f32>(pos[vertexIndex], 0.0, 1.0);\n                        return output;\n                        }\n\n                        @group(0) @binding(0) var imgSampler : sampler;\n                        @group(0) @binding(1) var img : texture_2d<f32>;\n\n                        @fragment\n                        fn fragmentMain(@location(0) texCoord : vec2<f32>) -> @location(0) vec4<f32> {\n                        return textureSample(img, imgSampler, texCoord);\n                        }\n                    " }), t = this.device.createRenderPipeline({
			layout: "auto",
			vertex: {
				module: this.mipmapShaderModule,
				entryPoint: "vertexMain"
			},
			fragment: {
				module: this.mipmapShaderModule,
				entryPoint: "fragmentMain",
				targets: [{ format: e }]
			}
		}), this.pipelines[e] = t), t;
	}
	generateMipmap(e) {
		let t = this._getMipmapPipeline(e.format);
		if (e.dimension === "3d" || e.dimension === "1d") throw Error("Generating mipmaps for non-2d textures is currently unsupported!");
		let n = e, r = e.depthOrArrayLayers || 1, i = e.usage & GPUTextureUsage.RENDER_ATTACHMENT;
		if (!i) {
			let t = {
				size: {
					width: Math.ceil(e.width / 2),
					height: Math.ceil(e.height / 2),
					depthOrArrayLayers: r
				},
				format: e.format,
				usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.RENDER_ATTACHMENT,
				mipLevelCount: e.mipLevelCount - 1
			};
			n = this.device.createTexture(t);
		}
		let a = this.device.createCommandEncoder({}), o = t.getBindGroupLayout(0);
		for (let s = 0; s < r; ++s) {
			let r = e.createView({
				baseMipLevel: 0,
				mipLevelCount: 1,
				dimension: "2d",
				baseArrayLayer: s,
				arrayLayerCount: 1
			}), c = +!!i;
			for (let i = 1; i < e.mipLevelCount; ++i) {
				let e = n.createView({
					baseMipLevel: c++,
					mipLevelCount: 1,
					dimension: "2d",
					baseArrayLayer: s,
					arrayLayerCount: 1
				}), i = a.beginRenderPass({ colorAttachments: [{
					view: e,
					storeOp: "store",
					loadOp: "clear",
					clearValue: {
						r: 0,
						g: 0,
						b: 0,
						a: 0
					}
				}] }), l = this.device.createBindGroup({
					layout: o,
					entries: [{
						binding: 0,
						resource: this.sampler
					}, {
						binding: 1,
						resource: r
					}]
				});
				i.setPipeline(t), i.setBindGroup(0, l), i.draw(3, 1, 0, 0), i.end(), r = e;
			}
		}
		if (!i) {
			let t = {
				width: Math.ceil(e.width / 2),
				height: Math.ceil(e.height / 2),
				depthOrArrayLayers: r
			};
			for (let r = 1; r < e.mipLevelCount; ++r) a.copyTextureToTexture({
				texture: n,
				mipLevel: r - 1
			}, {
				texture: e,
				mipLevel: r
			}, t), t.width = Math.ceil(t.width / 2), t.height = Math.ceil(t.height / 2);
		}
		return this.device.queue.submit([a.finish()]), i || n.destroy(), e;
	}
}, Xo = class {
	constructor(e) {
		this.textureView = null, this.gpuTexture = e;
	}
	destroy() {
		this.gpuTexture.destroy(), this.textureView = null, this.gpuTexture = null;
	}
}, Zo = class e {
	constructor(t) {
		this._gpuSamplers = /* @__PURE__ */ Object.create(null), this._bindGroupHash = /* @__PURE__ */ Object.create(null), this._renderer = t, t.gc.addCollection(this, "_bindGroupHash", "hash"), this._managedTextures = new V({
			renderer: t,
			type: "resource",
			onUnload: this.onSourceUnload.bind(this),
			name: "gpuTextureSource"
		});
		let n = {
			image: qo,
			buffer: Vo,
			video: Jo,
			compressed: Wo,
			...e.uploadExtensions
		};
		this._uploads = {
			...n,
			cube: Ko(n)
		};
	}
	get managedTextures() {
		return Object.values(this._managedTextures.items);
	}
	contextChange(e) {
		this._gpu = e;
	}
	initSource(e) {
		return e._gpuData[this._renderer.uid]?.gpuTexture || this._initSource(e);
	}
	_initSource(e) {
		if (e.autoGenerateMipmaps) {
			let t = Math.max(e.pixelWidth, e.pixelHeight);
			e.mipLevelCount = Math.floor(Math.log2(t)) + 1;
		}
		let t;
		e.sampleCount > 1 ? (t = GPUTextureUsage.RENDER_ATTACHMENT, e.transient && this._renderer.device.extensions.transientAttachment && (t |= GPUTextureUsage.TRANSIENT_ATTACHMENT)) : (t = GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST, e.uploadMethodId !== "compressed" && (t |= GPUTextureUsage.RENDER_ATTACHMENT, t |= GPUTextureUsage.COPY_SRC));
		let n = Ho[e.format] || {
			blockBytes: 4,
			blockWidth: 1,
			blockHeight: 1
		}, r = Math.ceil(e.pixelWidth / n.blockWidth) * n.blockWidth, i = Math.ceil(e.pixelHeight / n.blockHeight) * n.blockHeight, a = {
			label: e.label,
			size: {
				width: r,
				height: i,
				depthOrArrayLayers: e.arrayLayerCount
			},
			format: e.format,
			sampleCount: e.sampleCount,
			mipLevelCount: e.mipLevelCount,
			dimension: e.dimension,
			usage: t
		}, o = this._gpu.device.createTexture(a);
		return e._gpuData[this._renderer.uid] = new Xo(o), this._managedTextures.add(e) && (e.on("update", this.onSourceUpdate, this), e.on("resize", this.onSourceResize, this), e.on("updateMipmaps", this.onUpdateMipmaps, this)), this.onSourceUpdate(e), o;
	}
	onSourceUpdate(e) {
		let t = this.getGpuSource(e);
		t && (this._uploads[e.uploadMethodId] && this._uploads[e.uploadMethodId].upload(e, t, this._gpu), e.autoGenerateMipmaps && e.mipLevelCount > 1 && this.onUpdateMipmaps(e));
	}
	onUpdateMipmaps(e) {
		this._mipmapGenerator ||= new Yo(this._gpu.device);
		let t = this.getGpuSource(e);
		this._mipmapGenerator.generateMipmap(t);
	}
	onSourceUnload(e) {
		e.off("update", this.onSourceUpdate, this), e.off("resize", this.onSourceResize, this), e.off("updateMipmaps", this.onUpdateMipmaps, this);
	}
	onSourceResize(e) {
		e._gcLastUsed = this._renderer.gc.now;
		let t = e._gpuData[this._renderer.uid], n = t?.gpuTexture;
		n ? (n.width !== e.pixelWidth || n.height !== e.pixelHeight) && (t.destroy(), this._bindGroupHash[e.uid] = null, e._gpuData[this._renderer.uid] = null, this.initSource(e)) : this.initSource(e);
	}
	_initSampler(e) {
		return this._gpuSamplers[e._resourceId] = this._gpu.device.createSampler(e), this._gpuSamplers[e._resourceId];
	}
	getGpuSampler(e) {
		return this._gpuSamplers[e._resourceId] || this._initSampler(e);
	}
	getGpuSource(e) {
		return e._gcLastUsed = this._renderer.gc.now, e._gpuData[this._renderer.uid]?.gpuTexture || this.initSource(e);
	}
	getTextureBindGroup(e) {
		return this._bindGroupHash[e.uid] || this._createTextureBindGroup(e);
	}
	_createTextureBindGroup(e) {
		let t = e.source;
		return this._bindGroupHash[e.uid] = new v({
			0: t,
			1: t.style,
			2: new x({ uTextureMatrix: {
				type: "mat3x3<f32>",
				value: e.textureMatrix.mapCoord
			} })
		}), this._bindGroupHash[e.uid];
	}
	getTextureView(e) {
		let t = e.source;
		t._gcLastUsed = this._renderer.gc.now;
		let n = t._gpuData[this._renderer.uid];
		return n ||= (this.initSource(t), t._gpuData[this._renderer.uid]), n.textureView ||= n.gpuTexture.createView({ dimension: t.viewDimension }), n.textureView;
	}
	generateCanvas(e) {
		let t = this._renderer, n = t.gpu.device.createCommandEncoder(), r = y.get().createCanvas();
		r.width = e.source.pixelWidth, r.height = e.source.pixelHeight;
		let i = r.getContext("webgpu");
		return i.configure({
			device: t.gpu.device,
			usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC,
			format: y.get().getNavigator().gpu.getPreferredCanvasFormat(),
			alphaMode: "premultiplied"
		}), n.copyTextureToTexture({
			texture: t.texture.getGpuSource(e.source),
			origin: {
				x: 0,
				y: 0
			}
		}, { texture: i.getCurrentTexture() }, {
			width: r.width,
			height: r.height
		}), t.gpu.device.queue.submit([n.finish()]), r;
	}
	getPixels(e) {
		let t = this.generateCanvas(e), n = Ue.getOptimalCanvasAndContext(t.width, t.height), r = n.context;
		r.drawImage(t, 0, 0);
		let { width: i, height: a } = t, o = r.getImageData(0, 0, i, a), s = new Uint8ClampedArray(o.data.buffer);
		return Ue.returnCanvasAndContext(n), {
			pixels: s,
			width: i,
			height: a
		};
	}
	destroy() {
		this._managedTextures.destroy();
		for (let e of Object.keys(this._bindGroupHash)) {
			let t = Number(e);
			this._bindGroupHash[t]?.destroy();
		}
		this._renderer = null, this._gpu = null, this._mipmapGenerator = null, this._gpuSamplers = null, this._bindGroupHash = null;
	}
};
Zo.extension = {
	type: [D.WebGPUSystem],
	name: "texture"
}, Zo.uploadExtensions = /* @__PURE__ */ Object.create(null);
var Qo = Zo;
e.handleByMap(D.TextureUploaderWebGPU, Qo.uploadExtensions);
//#endregion
//#region node_modules/pixi.js/lib/scene/graphics/gpu/GpuGraphicsAdaptor.mjs
var $o = class {
	constructor() {
		this._maxTextures = 0;
	}
	contextChange(e) {
		let t = new x({
			uTransformMatrix: {
				value: new i(),
				type: "mat3x3<f32>"
			},
			uColor: {
				value: new Float32Array([
					1,
					1,
					1,
					1
				]),
				type: "vec4<f32>"
			},
			uRound: {
				value: 0,
				type: "f32"
			}
		});
		this._maxTextures = e.limits.maxBatchableTextures;
		let n = we({
			name: "graphics",
			bits: [
				Ce,
				ke(this._maxTextures),
				Qe,
				Ee
			]
		});
		this.shader = new f({
			gpuProgram: n,
			resources: { localUniforms: t }
		});
	}
	execute(e, t) {
		let n = t.context, r = n.customShader || this.shader, i = e.renderer, { batcher: a, instructions: o } = i.graphicsContext.getContextRenderData(n), s = i.encoder;
		s.setGeometry(a.geometry, r.gpuProgram);
		let c = i.globalUniforms.bindGroup;
		s.setBindGroup(0, c, r.gpuProgram);
		let l = i.renderPipes.uniformBatch.getUniformBindGroup(r.resources.localUniforms, !0);
		s.setBindGroup(2, l, r.gpuProgram);
		let u = o.instructions, d = null;
		for (let t = 0; t < o.instructionSize; t++) {
			let n = u[t];
			if (n.topology !== d && (d = n.topology, s.setPipelineFromGeometryProgramAndState(a.geometry, r.gpuProgram, e.state, n.topology)), r.groups[1] = n.bindGroup, !n.gpuBindGroup) {
				let e = n.textures;
				n.bindGroup = He(e.textures, e.count, this._maxTextures), n.gpuBindGroup = i.bindGroup.getBindGroup(n.bindGroup, r.gpuProgram, 1);
			}
			s.setBindGroup(1, n.bindGroup, r.gpuProgram), s.renderPassEncoder.drawIndexed(n.size, 1, n.start);
		}
	}
	destroy() {
		this.shader.destroy(!0), this.shader = null;
	}
};
$o.extension = {
	type: [D.WebGPUPipesAdaptor],
	name: "graphics"
};
//#endregion
//#region node_modules/pixi.js/lib/scene/mesh/gpu/GpuMeshAdapter.mjs
var es = class {
	init() {
		let e = we({
			name: "mesh",
			bits: [
				Ke,
				Ye,
				Ee
			]
		});
		this._shader = new f({
			gpuProgram: e,
			resources: {
				uTexture: T.EMPTY._source,
				uSampler: T.EMPTY._source.style,
				textureUniforms: { uTextureMatrix: {
					type: "mat3x3<f32>",
					value: new i()
				} }
			}
		});
	}
	execute(e, t) {
		let n = e.renderer, r = t._shader;
		if (!r) r = this._shader, r.groups[2] = n.texture.getTextureBindGroup(t.texture);
		else if (!r.gpuProgram) {
			w("Mesh shader has no gpuProgram", t.shader);
			return;
		}
		let i = r.gpuProgram;
		if (i.autoAssignGlobalUniforms && (r.groups[0] = n.globalUniforms.bindGroup), i.autoAssignLocalUniforms) {
			let t = e.localUniforms;
			r.groups[1] = n.renderPipes.uniformBatch.getUniformBindGroup(t, !0);
		}
		n.encoder.draw({
			geometry: t._geometry,
			shader: r,
			state: t.state
		});
	}
	destroy() {
		this._shader.destroy(!0), this._shader = null;
	}
};
es.extension = {
	type: [D.WebGPUPipesAdaptor],
	name: "mesh"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gpu/WebGPURenderer.mjs
var ts = /* @__PURE__ */ s({ WebGPURenderer: () => cs }), ns = [
	...ve,
	Ao,
	Co,
	So,
	wo,
	yo,
	Qo,
	Ro,
	zo,
	Bo,
	Fo,
	xo,
	To,
	_o
], rs = [...ge, jo], is = [
	$r,
	es,
	$o
], as = [], os = [], ss = [];
e.handleByNamedList(D.WebGPUSystem, as), e.handleByNamedList(D.WebGPUPipes, os), e.handleByNamedList(D.WebGPUPipesAdaptor, ss), e.add(...ns, ...rs, ...is);
var cs = class extends pe {
	constructor() {
		let e = {
			name: "webgpu",
			type: c.WEBGPU,
			systems: as,
			renderPipes: os,
			renderPipeAdaptors: ss
		};
		super(e);
	}
}, ls = /* @__PURE__ */ s({ BitmapFont: () => us }), us = class extends Rr {
	constructor(e, r) {
		super();
		let { textures: i, data: a } = e;
		Object.keys(a.pages).forEach((e) => {
			let t = i[a.pages[parseInt(e, 10)].id];
			this.pages.push({ texture: t });
		}), Object.keys(a.chars).forEach((e) => {
			let r = a.chars[e], { frame: o, source: s, rotate: c } = i[r.page], l = new T({
				frame: n.transformRectCoords(r, o, c, new t()),
				orig: new t(0, 0, r.width, r.height),
				source: s,
				rotate: c
			});
			this.chars[e] = {
				id: e.codePointAt(0),
				xOffset: r.xOffset,
				yOffset: r.yOffset,
				xAdvance: r.xAdvance,
				kerning: r.kerning ?? {},
				texture: l
			};
		}), this.baseRenderedFontSize = a.fontSize, this.baseMeasurementFontSize = a.fontSize, this.fontMetrics = {
			ascent: 0,
			descent: 0,
			fontSize: a.fontSize
		}, this.baseLineOffset = a.baseLineOffset, this.lineHeight = a.lineHeight, this.fontFamily = a.fontFamily, this.distanceField = a.distanceField ?? {
			type: "none",
			range: 0
		}, this.url = r;
	}
	destroy() {
		super.destroy();
		for (let e = 0; e < this.pages.length; e++) {
			let { texture: t } = this.pages[e];
			t.destroy(!0);
		}
		this.pages = null;
	}
	static install(e) {
		qr.install(e);
	}
	static uninstall(e) {
		qr.uninstall(e);
	}
};
//#endregion
//#region node_modules/pixi.js/lib/index.mjs
e.add(wt, Tt);
//#endregion
//#region src/runtime/operatorPixi.ts
var ds = class {
	container;
	options;
	app = null;
	sprite = null;
	legacyTextures = /* @__PURE__ */ new Map();
	legacyPageTextures = [];
	animationTextures = /* @__PURE__ */ new Map();
	pendingAnimations = /* @__PURE__ */ new Map();
	elapsedMs = 0;
	animation;
	profile;
	samplingMode;
	renderScale;
	anchor;
	maxTextureSize = 0;
	playRequest = 0;
	anchorAnimationFrame = null;
	finishAnchorMovement = null;
	paused = !1;
	destroyed = !1;
	constructor(e, t) {
		if (this.container = e, this.options = t, !t.atlas && !t.sheetIndex) throw Error("OperatorPixiRuntime requires an atlas or animation sheet index.");
		this.animation = U(t.animation, "idle_breathe_posture_locked"), this.profile = t.profile ?? "60fps", this.samplingMode = t.samplingMode ?? "smooth_safe", this.renderScale = fs(t.renderScale), this.anchor = ps(t.anchor ?? {
			x: .47,
			y: .78
		});
	}
	async init() {
		let e = new Ft();
		await e.init({
			resizeTo: this.container,
			backgroundAlpha: 0,
			antialias: !0,
			autoDensity: !0,
			preserveDrawingBuffer: !0,
			resolution: Math.min(window.devicePixelRatio || 1, 2)
		}), this.app = e, this.container.appendChild(e.canvas), this.maxTextureSize = ms();
		let t;
		if (this.options.sheetIndex) {
			let e = await this.loadAnimationWithFallback(this.animation);
			this.animation = e.animation, t = e.frames[0];
		} else this.assertLegacyTextureSupport(), await this.loadLegacyTextures(), t = this.getFrameTexture(0);
		this.sprite = new ie({
			texture: t.texture,
			roundPixels: !0
		}), this.sprite.anchor.set(t.pivot.x, t.pivot.y), this.sprite.scale.set(this.renderScale), e.stage.addChild(this.sprite), this.placeSprite(), e.ticker.add((e) => {
			this.elapsedMs += e.deltaMS, this.tick();
		}), this.paused && e.ticker.stop(), window.addEventListener("resize", this.placeSprite), this.options.sheetIndex && this.prefetch(this.prefetchCandidates(this.animation));
	}
	async play(e, t = this.profile) {
		let n = U(e, "idle_breathe_posture_locked");
		this.profile = t;
		let r = ++this.playRequest;
		if (this.options.sheetIndex) {
			let e = await this.loadAnimationWithFallback(n);
			return this.destroyed || r !== this.playRequest ? this.animation : (this.animation = e.animation, this.elapsedMs = 0, this.applyFrame(0), this.evictSheetCache(/* @__PURE__ */ new Set([this.animation])), this.prefetch(this.prefetchCandidates(this.animation)), this.animation);
		}
		return this.options.atlas?.animations[n] ? (this.animation = n, this.elapsedMs = 0, this.animation) : this.animation;
	}
	async prefetch(e) {
		if (!(!this.options.sheetIndex || this.destroyed)) for (let t of e) {
			let e = U(t, this.fallbackAnimation());
			if (this.animationTextures.has(e)) {
				this.touchAnimation(e);
				continue;
			}
			try {
				await this.ensureSheetAnimation(e);
			} catch {}
			this.evictSheetCache(/* @__PURE__ */ new Set([this.animation]));
		}
	}
	setProfile(e) {
		this.profile = e;
	}
	setSamplingMode(e) {
		this.samplingMode = e, this.applySamplingMode();
	}
	setRenderScale(e) {
		this.renderScale = fs(e), this.sprite?.scale.set(this.renderScale), this.placeSprite();
	}
	setPaused(e) {
		this.paused = e, this.app && (e ? this.app.ticker.stop() : this.app.ticker.start());
	}
	setAnchor(e) {
		return this.cancelAnchorMovement(), this.anchor = ps(e), this.placeSprite(), { ...this.anchor };
	}
	moveAnchor(e, t = 0, n = "ease_out") {
		this.cancelAnchorMovement();
		let r = ps(e), i = Math.min(4e3, Math.max(0, Number.isFinite(t) ? t : 0));
		if (i === 0 || typeof requestAnimationFrame != "function") return this.anchor = r, this.placeSprite(), Promise.resolve({ ...this.anchor });
		let a = { ...this.anchor }, o = performance.now();
		return new Promise((e) => {
			this.finishAnchorMovement = e;
			let t = (s) => {
				let c = Math.min(1, Math.max(0, (s - o) / i)), l = n === "linear" ? c : 1 - (1 - c) ** 3;
				if (this.anchor = {
					x: a.x + (r.x - a.x) * l,
					y: a.y + (r.y - a.y) * l
				}, this.placeSprite(), c < 1) {
					this.anchorAnimationFrame = requestAnimationFrame(t);
					return;
				}
				this.anchorAnimationFrame = null, this.finishAnchorMovement = null, e({ ...this.anchor });
			};
			this.anchorAnimationFrame = requestAnimationFrame(t);
		});
	}
	snapshot() {
		return {
			mode: this.options.sheetIndex ? "animation_sheets" : "legacy_atlas",
			loadedAnimations: [...this.animationTextures.keys()],
			maxResidentAnimations: this.options.sheetIndex ? this.maxResidentAnimations() : null,
			fallbackAnimation: this.options.sheetIndex ? this.fallbackAnimation() : null,
			paused: this.paused,
			anchor: { ...this.anchor }
		};
	}
	destroy() {
		this.destroyed = !0, this.playRequest += 1, this.cancelAnchorMovement(), window.removeEventListener("resize", this.placeSprite), this.app?.destroy(!0), this.app = null, this.sprite = null, this.legacyTextures.clear(), this.legacyPageTextures = [];
		for (let e of [...this.animationTextures.keys()]) this.releaseSheetAnimation(e);
		this.pendingAnimations.clear();
	}
	async loadLegacyTextures() {
		let e = this.options.atlas;
		if (!e) throw Error("Legacy atlas is unavailable.");
		let n = this.options.assetBasePath ?? "/assets/operator/hy60-v1", r = await Promise.all(e.pages.map((e) => G.load(`${n}/${e.image.replaceAll("\\", "/")}`)));
		this.legacyPageTextures = r, this.applySamplingMode();
		for (let [n, i] of Object.entries(e.frames)) {
			let e = r[i.page], a = new T({
				source: e.source,
				frame: new t(i.x, i.y, i.w, i.h)
			});
			this.legacyTextures.set(n, {
				texture: a,
				pivot: i.pivot
			});
		}
	}
	async loadAnimationWithFallback(e) {
		try {
			return await this.ensureSheetAnimation(e);
		} catch (t) {
			let n = this.fallbackAnimation();
			if (e === n) throw t;
			return this.options.onAssetFallback?.(e, n, t), this.ensureSheetAnimation(n);
		}
	}
	ensureSheetAnimation(e) {
		let n = this.animationTextures.get(e);
		if (n) return this.touchAnimation(e), Promise.resolve(n);
		let r = this.pendingAnimations.get(e);
		if (r) return r;
		let i = this.options.sheetIndex?.animations[e];
		if (!i) return Promise.reject(/* @__PURE__ */ Error(`Animation sheet is unavailable for ${e}`));
		if (this.maxTextureSize && (i.frameWidth > this.maxTextureSize || i.frameHeight > this.maxTextureSize)) return Promise.reject(/* @__PURE__ */ Error(`GPU max texture size ${this.maxTextureSize}px is below animation frame size ${i.frameWidth}x${i.frameHeight}`));
		let a = `${this.options.assetBasePath ?? "/assets/operator/hy60-v2"}/${i.image.replaceAll("\\", "/")}`, o = G.load(a).then((n) => {
			if (this.destroyed) throw G.unload(a), Error("Operator runtime was destroyed while loading an animation sheet.");
			if (this.maxTextureSize && (n.width > this.maxTextureSize || n.height > this.maxTextureSize)) throw G.unload(a), Error(`GPU max texture size ${this.maxTextureSize}px is below animation sheet ${n.width}x${n.height}`);
			this.applyTextureSampling(n);
			let r = {
				animation: e,
				frames: Array.from({ length: i.frameCount }, (e, r) => {
					let a = r % i.columns, o = Math.floor(r / i.columns);
					return {
						texture: new T({
							source: n.source,
							frame: new t(a * i.cellWidth + i.padding, o * i.cellHeight + i.padding, i.frameWidth, i.frameHeight)
						}),
						pivot: i.pivot
					};
				}),
				fps: i.fps,
				sourceTexture: n,
				url: a
			};
			return this.animationTextures.set(e, r), this.evictSheetCache(/* @__PURE__ */ new Set([this.animation])), r;
		}).finally(() => {
			this.pendingAnimations.delete(e);
		});
		return this.pendingAnimations.set(e, o), o;
	}
	applySamplingMode() {
		for (let e of this.legacyPageTextures) this.applyTextureSampling(e);
		for (let e of this.animationTextures.values()) this.applyTextureSampling(e.sourceTexture);
	}
	applyTextureSampling(e) {
		e.source.addressMode = "clamp-to-edge", e.source.autoGenerateMipmaps = !1, e.source.mipmapFilter = "nearest", e.source.scaleMode = this.samplingMode === "strict_nearest" ? "nearest" : "linear", e.source.update();
	}
	tick() {
		if (this.destroyed || !this.sprite) return;
		let e = this.frameCount();
		if (!e) return;
		let t = this.sourceFps(), n;
		if (this.profile === "120fps_hold_double") {
			let r = Math.floor(this.elapsedMs / 1e3 * (t * 2));
			n = Math.floor(r / 2) % e;
		} else {
			let r = this.profile === "120fps_native" ? Math.min(120, t) : Math.min(60, t);
			n = Math.floor(this.elapsedMs / 1e3 * r) % e;
		}
		this.applyFrame(n);
	}
	applyFrame(e) {
		if (!this.sprite) return;
		let t = this.getFrameTexture(e);
		this.sprite.texture = t.texture, this.sprite.anchor.set(t.pivot.x, t.pivot.y), this.placeSprite();
	}
	getFrameTexture(e) {
		let t = this.animationTextures.get(this.animation);
		if (t) {
			this.touchAnimation(this.animation);
			let n = t.frames[e % t.frames.length];
			if (n) return n;
		}
		let n = this.options.atlas, r = n?.animations[this.animation] ?? n?.animations.idle_breathe_posture_locked, i = r?.[e % r.length], a = i ? this.legacyTextures.get(i) : null;
		if (!a) throw Error(`Missing frame ${String(i)} for animation ${this.animation}`);
		return a;
	}
	frameCount() {
		let e = this.animationTextures.get(this.animation);
		return e ? e.frames.length : this.options.atlas?.animations[this.animation]?.length ?? this.options.atlas?.animations.idle_breathe_posture_locked.length ?? 0;
	}
	sourceFps() {
		return this.animationTextures.get(this.animation)?.fps ?? this.options.atlas?.meta.fps ?? 60;
	}
	prefetchCandidates(e) {
		return this.options.sheetIndex?.prefetch[e]?.slice(0, 3) ?? [];
	}
	fallbackAnimation() {
		return this.options.sheetIndex?.fallbackAnimation ?? "idle_breathe_posture_locked";
	}
	maxResidentAnimations() {
		return Math.min(4, Math.max(1, this.options.sheetIndex?.maxResidentAnimations ?? 4));
	}
	touchAnimation(e) {
		let t = this.animationTextures.get(e);
		t && (this.animationTextures.delete(e), this.animationTextures.set(e, t));
	}
	evictSheetCache(e) {
		for (; this.animationTextures.size > this.maxResidentAnimations();) {
			let t = [...this.animationTextures.keys()].find((t) => !e.has(t));
			if (!t) return;
			this.releaseSheetAnimation(t);
		}
	}
	releaseSheetAnimation(e) {
		let t = this.animationTextures.get(e);
		if (t) {
			this.animationTextures.delete(e);
			for (let e of t.frames) e.texture.destroy(!1);
			G.unload(t.url).catch(() => void 0);
		}
	}
	placeSprite = () => {
		!this.sprite || !this.app || (this.sprite.x = Math.round(this.app.renderer.width * this.anchor.x), this.sprite.y = Math.round(this.app.renderer.height * this.anchor.y));
	};
	cancelAnchorMovement() {
		this.anchorAnimationFrame != null && cancelAnimationFrame(this.anchorAnimationFrame), this.anchorAnimationFrame = null, this.finishAnchorMovement && this.finishAnchorMovement({ ...this.anchor }), this.finishAnchorMovement = null;
	}
	assertLegacyTextureSupport() {
		if (!(!this.maxTextureSize || !this.options.atlas)) {
			for (let e of this.options.atlas.pages) if (e.width > this.maxTextureSize || e.height > this.maxTextureSize) throw Error(`GPU max texture size ${this.maxTextureSize}px is below required atlas page ${e.width}x${e.height}. Regenerate smaller atlases before runtime use.`);
		}
	}
};
function fs(e = 2.35) {
	return Number.isFinite(e) ? Math.min(4, Math.max(.25, e)) : 2.35;
}
function ps(e) {
	return {
		x: Math.min(1, Math.max(0, Number.isFinite(e.x) ? e.x : .47)),
		y: Math.min(1, Math.max(0, Number.isFinite(e.y) ? e.y : .78))
	};
}
function ms() {
	let e = document.createElement("canvas"), t = e.getContext("webgl2") ?? e.getContext("webgl");
	return t && Number(t.getParameter(t.MAX_TEXTURE_SIZE)) || 0;
}
//#endregion
//#region src/embed/operatorElement.ts
var hs = "2.0.0", gs = "hyperion:operator-event", _s = "hyperion:operator-route-change", vs = "hyperion:operator-location-change", ys = "./assets/operator/hy60-v2", bs = "idle_breathe_posture_locked", xs = /(token|secret|password|authorization|cookie|credential|api[_-]?key)/i, Ss = class extends HTMLElement {
	root = this.attachShadow({ mode: "open" });
	stage = document.createElement("div");
	status = document.createElement("span");
	assets = null;
	runtime = null;
	motion = null;
	activeAnimation = bs;
	profile = "60fps";
	samplingMode = "smooth_safe";
	renderScale = 1.35;
	residentSettings = Ts();
	activeRoute = Ks();
	activeRouteRule = null;
	routeEnabled = !0;
	offscreen = !1;
	paused = !1;
	pauseReasons = [];
	manuallyPaused = !1;
	reducedMotionQuery = null;
	intersectionObserver = null;
	movementSequence = 0;
	managedTabIndex = !1;
	managedRole = !1;
	ready = !1;
	initialized = !1;
	static get observedAttributes() {
		return [
			"asset-base",
			"animation",
			"profile",
			"sampling",
			"scale",
			"anchor",
			"chat-endpoint",
			"tap-to-open",
			"pause-when-hidden",
			"pause-when-offscreen",
			"reduced-motion-policy",
			"mobile-policy",
			"mobile-breakpoint"
		];
	}
	constructor() {
		super(), this.stage.className = "stage", this.stage.setAttribute("part", "stage"), this.status.className = "status", this.status.setAttribute("part", "status"), this.status.textContent = "initializing operator runtime", this.root.append(ws(), this.stage, this.status), this.stage.addEventListener("click", this.onTap);
	}
	connectedCallback() {
		!this.status.isConnected && !this.ready && this.root.append(this.status), this.initialized || (this.initialized = !0, this.init()), window.addEventListener(gs, this.onHostEvent), window.addEventListener(_s, this.onRouteEvent), window.addEventListener(vs, this.onRouteEvent), window.addEventListener("popstate", this.onRouteEvent), window.addEventListener("hashchange", this.onRouteEvent), window.addEventListener("resize", this.evaluatePolicies), document.addEventListener("visibilitychange", this.evaluatePolicies), this.addEventListener("keydown", this.onKeyDown), ac(), this.installPolicyObservers(), this.updateInteractionSemantics(), this.applyRoute(Ks());
	}
	disconnectedCallback() {
		window.removeEventListener(gs, this.onHostEvent), window.removeEventListener(_s, this.onRouteEvent), window.removeEventListener(vs, this.onRouteEvent), window.removeEventListener("popstate", this.onRouteEvent), window.removeEventListener("hashchange", this.onRouteEvent), window.removeEventListener("resize", this.evaluatePolicies), document.removeEventListener("visibilitychange", this.evaluatePolicies), this.removeEventListener("keydown", this.onKeyDown), oc(), this.removePolicyObservers(), this.motion?.destroy(), this.motion = null, this.runtime?.destroy(), this.runtime = null, this.assets = null, this.ready = !1, this.initialized = !1;
	}
	attributeChangedCallback(e) {
		e === "chat-endpoint" && !this.hasAttribute("chat-endpoint") && (this.residentSettings.chatEndpoint = null), !(!this.initialized || !this.ready) && this.applyAttributes();
	}
	async configure(e) {
		e.assetBasePath && this.setAttribute("asset-base", e.assetBasePath), e.animation && this.setAttribute("animation", String(e.animation)), e.profile && this.setAttribute("profile", e.profile), e.samplingMode && this.setAttribute("sampling", e.samplingMode), typeof e.renderScale == "number" && this.setAttribute("scale", String(e.renderScale)), (e.resident || e.chatEndpoint !== void 0) && this.configureResident({
			...e.resident,
			chatEndpoint: e.chatEndpoint === void 0 ? e.resident?.chatEndpoint : e.chatEndpoint
		}), this.ready && this.applyAttributes();
	}
	configureResident(e) {
		return this.residentSettings = Es(this.residentSettings, e), this.updateInteractionSemantics(), this.applyRoute(this.activeRoute), this.evaluatePolicies(), Ds(this.residentSettings);
	}
	play(e) {
		this.motion?.playDirect(e, this.profile, "embedded direct animation request");
	}
	prefetch(e) {
		return this.runtime?.prefetch(e) ?? Promise.resolve();
	}
	dispatch(e) {
		if (!this.ready) return null;
		let t = yt(qs(e.kind), Js(e.message), Ys(e.source), e.severity, Xs(e.payload));
		return this.motion?.request(t.resolved, this.profile), this.dispatchEvent(new CustomEvent("operator-event-routed", {
			detail: {
				event: t,
				state: t.resolved,
				route: this.activeRoute,
				version: hs
			},
			bubbles: !0,
			composed: !0
		})), t;
	}
	async move(e) {
		let t = { ...this.residentSettings.anchor }, n = Is(e.target, this.residentSettings.anchorBounds), r = {
			id: String(e.id || "").slice(0, 96) || void 0,
			target: n,
			durationMs: Ls(e.durationMs),
			easing: e.easing === "linear" ? "linear" : "ease_out",
			reason: String(e.reason || "host anchor request").slice(0, 180)
		}, i = {
			from: t,
			to: n,
			intent: r,
			bounds: { ...this.residentSettings.anchorBounds },
			route: this.activeRoute
		};
		if (!this.dispatchEvent(new CustomEvent("operator-anchor-will-move", {
			detail: i,
			cancelable: !0,
			bubbles: !0,
			composed: !0
		}))) return t;
		let a = ++this.movementSequence, o = this.reducedMotionQuery?.matches && this.residentSettings.reducedMotion !== "allow" ? 0 : r.durationMs, s = this.runtime ? await this.runtime.moveAnchor(n, o, r.easing) : n;
		return a === this.movementSequence ? (this.residentSettings.anchor = s, this.dispatchEvent(new CustomEvent("operator-anchor-moved", {
			detail: {
				...i,
				to: s
			},
			bubbles: !0,
			composed: !0
		})), { ...s }) : { ...this.residentSettings.anchor };
	}
	pause(e = !0) {
		this.manuallyPaused = e, this.evaluatePolicies();
	}
	syncRoute(e = Ks()) {
		this.applyRoute(e);
	}
	snapshot() {
		return {
			version: hs,
			ready: this.ready,
			animation: this.activeAnimation,
			profile: this.profile,
			samplingMode: this.samplingMode,
			renderScale: this.renderScale,
			route: this.activeRoute,
			routeRule: this.activeRouteRule,
			visible: this.routeEnabled && !(Hs(this.residentSettings.mobileBreakpointPx) && this.residentSettings.mobile === "hide"),
			paused: this.paused,
			pauseReasons: [...this.pauseReasons],
			resident: Ds(this.residentSettings),
			assets: this.runtime?.snapshot() ?? null,
			motion: this.motion?.snapshot() ?? null
		};
	}
	async init() {
		try {
			this.readAttributes(), this.assets = await rt(this.assetBasePath()), this.runtime = new ds(this.stage, {
				atlas: this.assets.atlas,
				sheetIndex: this.assets.sheetIndex,
				assetBasePath: this.assets.basePath,
				animation: this.activeAnimation,
				profile: this.profile,
				samplingMode: this.samplingMode,
				renderScale: this.renderScale,
				anchor: this.residentSettings.anchor,
				onAssetFallback: (e, t, n) => {
					this.dispatchEvent(new CustomEvent("operator-animation-fallback", {
						detail: {
							requested: e,
							fallback: t,
							message: $s(n),
							version: hs
						},
						bubbles: !0,
						composed: !0
					}));
				}
			}), await this.runtime.init(), this.motion = new Ct({
				transitionDurationMs: this.assets.manifest.frame.framesPerAnimation * this.assets.manifest.frame.frameDurationMs,
				onPlay: (e, t) => {
					this.activeAnimation = e, this.runtime?.play(e, t).then((e) => {
						this.activeAnimation = e;
					}).catch((e) => this.emitRuntimeError(e));
				},
				onStateChange: (e) => this.emitState(e)
			}), this.ready = !0, this.status.remove(), this.motion.playDirect(this.activeAnimation, this.profile, "embedded runtime ready"), this.applyRoute(this.activeRoute), this.evaluatePolicies(), this.dispatchEvent(new CustomEvent("operator-runtime-ready", {
				detail: this.snapshot(),
				bubbles: !0,
				composed: !0
			}));
		} catch (e) {
			this.emitRuntimeError(e);
		}
	}
	applyAttributes() {
		this.readAttributes(), this.runtime?.setProfile(this.profile), this.runtime?.setSamplingMode(this.samplingMode), this.runtime?.setRenderScale(this.renderScale), this.runtime?.setAnchor(Is(this.residentSettings.anchor, this.residentSettings.anchorBounds));
		let e = this.getAttribute("animation");
		e && this.motion?.playDirect(e, this.profile, "embedded attribute update"), this.updateInteractionSemantics(), this.applyRoute(this.activeRoute), this.evaluatePolicies();
	}
	readAttributes() {
		this.profile = js(this.getAttribute("profile")), this.samplingMode = this.getAttribute("sampling") === "strict_nearest" ? "strict_nearest" : "smooth_safe", this.renderScale = Qs(Number(this.getAttribute("scale") ?? 1.35));
		let e = this.getAttribute("animation");
		e && (this.activeAnimation = U(e, bs));
		let t = zs(this.getAttribute("anchor"));
		t && (this.residentSettings.anchor = Is(t, this.residentSettings.anchorBounds)), this.hasAttribute("chat-endpoint") && (this.residentSettings.chatEndpoint = Bs(this.getAttribute("chat-endpoint"))), this.hasAttribute("tap-to-open") && (this.residentSettings.tapToOpen = Vs(this.getAttribute("tap-to-open"), !0)), this.hasAttribute("pause-when-hidden") && (this.residentSettings.pauseWhenDocumentHidden = Vs(this.getAttribute("pause-when-hidden"), !0)), this.hasAttribute("pause-when-offscreen") && (this.residentSettings.pauseWhenOffscreen = Vs(this.getAttribute("pause-when-offscreen"), !0)), this.hasAttribute("reduced-motion-policy") && (this.residentSettings.reducedMotion = Ms(this.getAttribute("reduced-motion-policy"))), this.hasAttribute("mobile-policy") && (this.residentSettings.mobile = Ns(this.getAttribute("mobile-policy"))), this.hasAttribute("mobile-breakpoint") && (this.residentSettings.mobileBreakpointPx = Rs(Number(this.getAttribute("mobile-breakpoint"))));
	}
	assetBasePath() {
		return this.getAttribute("asset-base")?.replace(/\/$/, "") || ys;
	}
	applyRoute(e) {
		this.activeRoute = Us(e);
		let t = this.residentSettings.routeRules.find((e) => Gs(e.pattern, this.activeRoute));
		this.activeRouteRule = t?.id ?? null, this.routeEnabled = t?.enabled ?? !0, t?.animation && this.ready && this.motion?.playDirect(t.animation, this.profile, `route ${t.id}`), t?.anchor && this.move({
			target: t.anchor,
			durationMs: 240,
			easing: "ease_out",
			reason: `route ${t.id}`
		});
		let n = [...this.residentSettings.prefetch, ...t?.prefetch ?? []];
		n.length && this.runtime?.prefetch(n), this.evaluatePolicies(), this.dispatchEvent(new CustomEvent("operator-route-applied", {
			detail: {
				route: this.activeRoute,
				rule: this.activeRouteRule,
				enabled: this.routeEnabled
			},
			bubbles: !0,
			composed: !0
		}));
	}
	installPolicyObservers() {
		this.reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)"), this.reducedMotionQuery.addEventListener("change", this.evaluatePolicies), typeof IntersectionObserver < "u" && (this.intersectionObserver = new IntersectionObserver(([e]) => {
			this.offscreen = !e?.isIntersecting, this.evaluatePolicies();
		}), this.intersectionObserver.observe(this));
	}
	removePolicyObservers() {
		this.reducedMotionQuery?.removeEventListener("change", this.evaluatePolicies), this.reducedMotionQuery = null, this.intersectionObserver?.disconnect(), this.intersectionObserver = null, this.offscreen = !1;
	}
	evaluatePolicies = () => {
		let e = Hs(this.residentSettings.mobileBreakpointPx), t = !!this.reducedMotionQuery?.matches, n = e && this.residentSettings.mobile === "hide", r = this.routeEnabled && !n;
		this.dataset.residentHidden = r ? "false" : "true";
		let i = [];
		this.manuallyPaused && i.push("manual"), this.routeEnabled || i.push("route_disabled"), n && i.push("mobile_hidden"), e && this.residentSettings.mobile === "pause" && i.push("mobile_policy"), document.hidden && this.residentSettings.pauseWhenDocumentHidden && i.push("document_hidden"), this.offscreen && this.residentSettings.pauseWhenOffscreen && i.push("offscreen"), t && this.residentSettings.reducedMotion !== "allow" && i.push(`reduced_motion_${this.residentSettings.reducedMotion}`);
		let a = i.length > 0, o = a !== this.paused || i.join("|") !== this.pauseReasons.join("|");
		this.paused = a, this.pauseReasons = i, this.runtime?.setPaused(a), o && this.dispatchEvent(new CustomEvent("operator-pause-change", {
			detail: {
				paused: a,
				reasons: [...i],
				route: this.activeRoute
			},
			bubbles: !0,
			composed: !0
		}));
	};
	updateInteractionSemantics() {
		if (this.residentSettings.tapToOpen) {
			this.hasAttribute("tabindex") || (this.tabIndex = 0, this.managedTabIndex = !0), this.hasAttribute("role") || (this.setAttribute("role", "button"), this.managedRole = !0), this.setAttribute("aria-haspopup", "dialog");
			return;
		}
		this.managedTabIndex && this.removeAttribute("tabindex"), this.managedRole && this.removeAttribute("role"), this.removeAttribute("aria-haspopup"), this.managedTabIndex = !1, this.managedRole = !1;
	}
	emitState(e) {
		this.dispatchEvent(new CustomEvent("operator-state-change", {
			detail: {
				...this.snapshot(),
				motion: e
			},
			bubbles: !0,
			composed: !0
		}));
	}
	emitRuntimeError(e) {
		this.status.dataset.mode = "error", this.status.textContent = $s(e), this.status.isConnected || this.root.append(this.status), this.dispatchEvent(new CustomEvent("operator-runtime-error", {
			detail: {
				message: this.status.textContent,
				version: hs
			},
			bubbles: !0,
			composed: !0
		}));
	}
	onHostEvent = (e) => {
		let t = e;
		!t.detail || typeof t.detail != "object" || this.dispatch(t.detail);
	};
	onRouteEvent = (e) => {
		let t = e.detail?.route;
		this.applyRoute(t || Ks());
	};
	onTap = (e) => {
		let t = {
			endpoint: this.residentSettings.chatEndpoint,
			route: this.activeRoute,
			routeRule: this.activeRouteRule,
			source: e.type,
			automaticOpen: !1,
			version: hs
		};
		this.dispatchEvent(new CustomEvent("operator-tap", {
			detail: t,
			bubbles: !0,
			composed: !0
		})), this.residentSettings.tapToOpen && this.dispatchEvent(new CustomEvent("operator-chat-open-request", {
			detail: t,
			bubbles: !0,
			composed: !0
		}));
	};
	onKeyDown = (e) => {
		!this.residentSettings.tapToOpen || e.key !== "Enter" && e.key !== " " || (e.preventDefault(), this.onTap(e));
	};
};
function Cs(e = "hyperion-operator") {
	customElements.get(e) || customElements.define(e, Ss);
}
function ws() {
	let e = document.createElement("style");
	return e.textContent = "\n    :host { display: block; position: relative; width: 100%; min-width: 160px; min-height: 180px; contain: content; }\n    :host([data-resident-hidden=\"true\"]) { visibility: hidden; pointer-events: none; }\n    :host(:focus-visible) { outline: 2px solid rgba(111, 226, 194, .82); outline-offset: 2px; }\n    .stage { position: absolute; inset: 0; overflow: hidden; background: transparent; cursor: pointer; }\n    .stage canvas { display: block; width: 100%; height: 100%; }\n    .status { position: absolute; left: 8px; right: 8px; bottom: 8px; padding: 6px 8px; border: 1px solid rgba(255, 90, 72, .42); background: rgba(5, 7, 9, .84); color: #ff7a6b; font: 10px/1.35 ui-monospace, SFMono-Regular, Consolas, monospace; }\n    .status[data-mode=\"error\"] { color: #ffb1a8; border-color: rgba(255, 90, 72, .72); }\n  ", e;
}
function Ts() {
	return {
		anchor: {
			x: .47,
			y: .78
		},
		anchorBounds: {
			minX: .1,
			maxX: .9,
			minY: .15,
			maxY: .92
		},
		routeRules: [],
		prefetch: [bs],
		pauseWhenDocumentHidden: !0,
		pauseWhenOffscreen: !0,
		reducedMotion: "static",
		mobile: "pause",
		mobileBreakpointPx: 720,
		chatEndpoint: null,
		tapToOpen: !0
	};
}
function Es(e, t) {
	let n = Ps({
		...e.anchorBounds,
		...t.anchorBounds
	});
	return {
		anchor: Is({
			...e.anchor,
			...t.anchor
		}, n),
		anchorBounds: n,
		routeRules: t.routeRules ? ks(t.routeRules) : e.routeRules.map(Os),
		prefetch: t.prefetch ? As(t.prefetch) : [...e.prefetch],
		pauseWhenDocumentHidden: t.pauseWhenDocumentHidden ?? e.pauseWhenDocumentHidden,
		pauseWhenOffscreen: t.pauseWhenOffscreen ?? e.pauseWhenOffscreen,
		reducedMotion: t.reducedMotion ? Ms(t.reducedMotion) : e.reducedMotion,
		mobile: t.mobile ? Ns(t.mobile) : e.mobile,
		mobileBreakpointPx: t.mobileBreakpointPx == null ? e.mobileBreakpointPx : Rs(t.mobileBreakpointPx),
		chatEndpoint: t.chatEndpoint === void 0 ? e.chatEndpoint : Bs(t.chatEndpoint),
		tapToOpen: t.tapToOpen ?? e.tapToOpen
	};
}
function Ds(e) {
	return {
		...e,
		anchor: { ...e.anchor },
		anchorBounds: { ...e.anchorBounds },
		routeRules: e.routeRules.map(Os),
		prefetch: [...e.prefetch]
	};
}
function Os(e) {
	return {
		...e,
		anchor: e.anchor ? { ...e.anchor } : void 0,
		prefetch: e.prefetch ? [...e.prefetch] : void 0
	};
}
function ks(e) {
	return e.slice(0, 64).map((e, t) => ({
		id: String(e.id || `route-${t + 1}`).replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 96),
		pattern: Ws(e.pattern),
		enabled: e.enabled ?? !0,
		animation: e.animation ? U(e.animation, bs) : void 0,
		anchor: e.anchor ? Fs(e.anchor) : void 0,
		prefetch: e.prefetch ? As(e.prefetch) : void 0
	}));
}
function As(e) {
	return [...new Set(e.map((e) => U(e, bs)))].slice(0, 16);
}
function js(e) {
	return e === "120fps_hold_double" || e === "120fps_native" ? e : "60fps";
}
function Ms(e) {
	return e === "allow" || e === "pause" ? e : "static";
}
function Ns(e) {
	return e === "allow" || e === "hide" ? e : "pause";
}
function Ps(e) {
	let t = $(e.minX, .1), n = Math.max(t, $(e.maxX, .9)), r = $(e.minY, .15);
	return {
		minX: t,
		maxX: n,
		minY: r,
		maxY: Math.max(r, $(e.maxY, .92))
	};
}
function Fs(e) {
	return {
		x: $(e.x, .47),
		y: $(e.y, .78)
	};
}
function Is(e, t) {
	return {
		x: Math.min(t.maxX, Math.max(t.minX, $(e.x, .47))),
		y: Math.min(t.maxY, Math.max(t.minY, $(e.y, .78)))
	};
}
function $(e, t) {
	return Number.isFinite(e) ? Math.min(1, Math.max(0, e)) : t;
}
function Ls(e) {
	return Number.isFinite(e) ? Math.min(4e3, Math.max(0, Number(e))) : 0;
}
function Rs(e) {
	return Number.isFinite(e) ? Math.round(Math.min(2400, Math.max(320, e))) : 720;
}
function zs(e) {
	if (!e) return null;
	let [t, n] = e.split(",").map(Number);
	return !Number.isFinite(t) || !Number.isFinite(n) ? null : Fs({
		x: t,
		y: n
	});
}
function Bs(e) {
	let t = String(e || "").trim();
	if (!t) return null;
	try {
		let e = new URL(t, document.baseURI);
		return e.protocol === "http:" || e.protocol === "https:" ? e.href : null;
	} catch {
		return null;
	}
}
function Vs(e, t) {
	return e == null || e === "" ? t : ![
		"false",
		"0",
		"off",
		"no"
	].includes(e.trim().toLowerCase());
}
function Hs(e) {
	return window.innerWidth <= e;
}
function Us(e) {
	let t = String(e || "/").trim().slice(0, 2048);
	return t.startsWith("/") || t.startsWith("#") ? t : `/${t}`;
}
function Ws(e) {
	let t = String(e || "*").trim().slice(0, 512);
	return t === "*" || t.startsWith("/") || t.startsWith("#") ? t : `/${t}`;
}
function Gs(e, t) {
	let n = Ws(e), r = n.startsWith("#") ? t.slice(Math.max(0, t.indexOf("#"))) : n.includes("?") || n.includes("#") ? t : t.split(/[?#]/, 1)[0], i = n.split("*").map((e) => e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*");
	return RegExp(`^${i}$`).test(r);
}
function Ks() {
	return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}
function qs(e) {
	return String(e || "").trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-").slice(0, 96) || "operator.inspect";
}
function Js(e) {
	return String(e || "Observed host event.").replace(/[\r\n\t]+/g, " ").trim().slice(0, 360) || "Observed host event.";
}
function Ys(e) {
	return [
		"demo",
		"nest",
		"mnem",
		"chron",
		"connect",
		"manual",
		"bridge",
		"ollama"
	].includes(e) ? e : "bridge";
}
function Xs(e) {
	if (!e || typeof e != "object") return;
	let t = Object.entries(e).filter(([e]) => !xs.test(e)).slice(0, 12).map(([e, t]) => [e.slice(0, 64), Zs(t)]);
	return t.length ? Object.fromEntries(t) : void 0;
}
function Zs(e) {
	return typeof e == "string" ? e.slice(0, 240) : typeof e == "number" ? Number.isFinite(e) ? e : null : typeof e == "boolean" || e === null ? e : "[redacted non-primitive]";
}
function Qs(e) {
	return Number.isFinite(e) ? Math.min(4, Math.max(.25, e)) : 1.35;
}
function $s(e) {
	return e instanceof Error ? e.message : String(e);
}
var ec = 0, tc = null, nc = null, rc = null, ic = null;
function ac() {
	ec += 1, ec === 1 && (tc = window.history.pushState, nc = window.history.replaceState, rc = function(e, t, n) {
		tc?.call(this, e, t, n), window.dispatchEvent(new Event(vs));
	}, ic = function(e, t, n) {
		nc?.call(this, e, t, n), window.dispatchEvent(new Event(vs));
	}, window.history.pushState = rc, window.history.replaceState = ic);
}
function oc() {
	ec = Math.max(0, ec - 1), ec === 0 && (tc && window.history.pushState === rc && (window.history.pushState = tc), nc && window.history.replaceState === ic && (window.history.replaceState = nc), tc = null, nc = null, rc = null, ic = null);
}
//#endregion
//#region src/embed/entry.ts
Cs();
//#endregion
export { Ss as HyperionOperatorElement, hs as OPERATOR_EMBED_VERSION, Cs as registerHyperionOperatorElement };
