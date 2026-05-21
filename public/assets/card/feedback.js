/*
 * feedback.js — subtle audio + haptic flourish for the operator card.
 *
 * The card's animations were already built; this is the missing human layer:
 * a sound and a vibration-motor pulse that correlate with each transition,
 * so the deliberate "tap to activate" reveal lands as an *experience*, not a
 * state change. Invitation, agency, reward — kept intentionally subtle.
 *
 * Web Audio needs a user gesture to start; the activate tap is that gesture,
 * so everything from activation onward has sound. navigator.vibrate is a
 * no-op on iOS (Apple disables it) — Android phones (the NFC-tap audience)
 * get the haptics; everyone gets the sound. Honors a global mute flag set
 * from the card's motion preference.
 */
(function () {
  let actx = null;
  let muted = false;

  function ctx() {
    if (muted) return null;
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === "suspended") actx.resume();
    } catch (e) {
      actx = null;
    }
    return actx;
  }

  // One short shaped tone. gain stays low — this is a flourish, not an alert.
  function tone(opts) {
    const a = ctx();
    if (!a) return;
    const t0 = a.currentTime;
    const dur = opts.dur || 0.08;
    const osc = a.createOscillator();
    const g = a.createGain();
    osc.type = opts.type || "sine";
    osc.frequency.setValueAtTime(opts.freq || 440, t0);
    if (opts.slideTo) {
      osc.frequency.exponentialRampToValueAtTime(opts.slideTo, t0 + dur);
    }
    const peak = opts.gain || 0.04;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + Math.min(0.02, dur / 3));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(a.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function vibrate(pattern) {
    if (muted) return;
    if (navigator.vibrate) {
      try { navigator.vibrate(pattern); } catch (e) { /* ignore */ }
    }
  }

  window.HypFeedback = {
    setMuted(m) { muted = !!m; },
    // Lock tapped — the invitation is accepted. Soft rising swell + a triple tick.
    activate() {
      tone({ freq: 330, slideTo: 760, dur: 0.5, type: "sine", gain: 0.05 });
      vibrate([12, 28, 18]);
    },
    // The scan sweep travels the card — a quiet low→high pass under it.
    sweep() {
      tone({ freq: 180, slideTo: 1100, dur: 0.85, type: "sawtooth", gain: 0.022 });
    },
    // Systems online — the reveal completes. Bright confirm + a single pulse.
    live() {
      tone({ freq: 880, dur: 0.12, type: "sine", gain: 0.045 });
      vibrate(22);
    },
    // Flip between faces — a short directional click.
    flip() {
      tone({ freq: 540, slideTo: 300, dur: 0.16, type: "triangle", gain: 0.04 });
      vibrate(14);
    },
    // Button / contact action — the lightest tick.
    click() {
      tone({ freq: 720, dur: 0.045, type: "square", gain: 0.03 });
      vibrate(8);
    },
  };
})();
