/* SacMusicals — tabla sound engine (synthesized)
   Synthesized tabla strokes (bols) and a soft tanpura drone.
   Nothing plays until a visitor interacts. */
(function () {
  let ac = null, master = null, noiseBuf = null;

  function ctx() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ac = new AC();
      const comp = ac.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 3;
      master = ac.createGain(); master.gain.value = 0.9;
      master.connect(comp).connect(ac.destination);
      noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }

  function partial(freq, gain, decay, t0, out, bendTo, bendTime) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (bendTo) o.frequency.exponentialRampToValueAtTime(bendTo, t0 + bendTime);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + decay);
    o.connect(g).connect(out || master);
    o.start(t0); o.stop(t0 + decay + 0.05);
  }

  function noise(t0, dur, gain, type, freq, out) {
    const s = ac.createBufferSource(); s.buffer = noiseBuf;
    const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    const g = ac.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f).connect(g).connect(out || master);
    s.start(t0); s.stop(t0 + dur + 0.02);
  }

  const SA = 293.66; // dayan tuned to D4
  const strokes = {
    // dayan (right drum)
    Na(t) {
      [1, 2, 3, 4, 5].forEach((h, i) =>
        partial(SA * h, [0.22, 0.3, 0.26, 0.16, 0.08][i], [0.45, 0.38, 0.3, 0.22, 0.16][i], t));
      noise(t, 0.03, 0.25, 'highpass', 3200);
    },
    Tin(t) {
      [1, 2, 3].forEach((h, i) =>
        partial(SA * h, [0.36, 0.2, 0.09][i], [1.0, 0.65, 0.4][i], t));
      noise(t, 0.02, 0.1, 'highpass', 2500);
    },
    Tun(t) {
      partial(SA, 0.48, 1.5, t);
      partial(SA * 2, 0.08, 0.5, t);
      noise(t, 0.04, 0.08, 'bandpass', 900);
    },
    // bayan (left drum)
    Ge(t) {
      partial(82, 0.75, 1.0, t, null, 108, 0.28);
      partial(164, 0.14, 0.5, t, null, 214, 0.28);
      noise(t, 0.06, 0.25, 'lowpass', 220);
    },
    Ke(t) {
      noise(t, 0.08, 0.6, 'lowpass', 520);
      partial(120, 0.25, 0.07, t);
    },
  };
  const combos = { Dha: ['Na', 'Ge'], Dhin: ['Tin', 'Ge'], Ta: ['Na'], Tin: ['Tin'] };

  function play(bol, when) {
    if (!ctx()) return;
    const t = when ?? ac.currentTime + 0.005;
    (combos[bol] || [bol]).forEach((s) => strokes[s] && strokes[s](t));
  }

  /* Teentaal theka: 16 beats */
  const THEKA = ['Dha', 'Dhin', 'Dhin', 'Dha', 'Dha', 'Dhin', 'Dhin', 'Dha',
                 'Dha', 'Tin', 'Tin', 'Ta', 'Ta', 'Dhin', 'Dhin', 'Dha'];
  let thekaTimer = null;
  function playTheka(onBeat, onEnd) {
    if (!ctx()) return;
    stopTheka();
    const beat = 0.42, start = ac.currentTime + 0.08;
    THEKA.forEach((b, i) => play(b, start + i * beat));
    play('Dha', start + 16 * beat); // land on sam
    let i = 0;
    const tick = () => {
      if (i <= 16) { onBeat && onBeat(i === 16 ? 'Dha' : THEKA[i], i); i++; thekaTimer = setTimeout(tick, beat * 1000); }
      else { thekaTimer = null; onEnd && onEnd(); }
    };
    thekaTimer = setTimeout(tick, 80);
  }
  function stopTheka() { if (thekaTimer) clearTimeout(thekaTimer); thekaTimer = null; }

  /* Tanpura drone: Pa Sa Sa Sa(low), soft and slow */
  let droneOn = false, droneBus = null, droneTimer = null, step = 0;
  const D3 = 146.83;
  const cycle = [D3 * 0.75, D3, D3, D3 / 2]; // Pa (A2), Sa, Sa, low Sa
  let wave = null;

  function pluck(freq, t) {
    if (!wave) {
      const n = 16, real = new Float32Array(n), imag = new Float32Array(n);
      for (let k = 1; k < n; k++) imag[k] = (k % 2 ? 1 : 0.7) / Math.pow(k, 0.9);
      wave = ac.createPeriodicWave(real, imag);
    }
    const o = ac.createOscillator(); o.setPeriodicWave(wave); o.frequency.value = freq;
    const o2 = ac.createOscillator(); o2.setPeriodicWave(wave); o2.frequency.value = freq * 1.002;
    const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 2;
    f.frequency.setValueAtTime(2600, t); f.frequency.exponentialRampToValueAtTime(700, t + 4);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.05, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 5.5);
    o.connect(f); o2.connect(f); f.connect(g).connect(droneBus);
    o.start(t); o2.start(t); o.stop(t + 5.6); o2.stop(t + 5.6);
  }

  function setDrone(on) {
    if (!ctx()) return false;
    droneOn = on;
    if (!droneBus) { droneBus = ac.createGain(); droneBus.connect(master); }
    droneBus.gain.cancelScheduledValues(ac.currentTime);
    droneBus.gain.setTargetAtTime(on ? 0.85 : 0.0001, ac.currentTime, on ? 0.6 : 0.4);
    if (on && !droneTimer) {
      const loop = () => { if (!droneOn) { droneTimer = null; return; }
        pluck(cycle[step % 4], ac.currentTime + 0.02); step++;
        droneTimer = setTimeout(loop, step % 4 === 0 ? 1700 : 1150); };
      loop();
    }
    return droneOn;
  }

  window.smAudio = { play, playTheka, stopTheka, setDrone, get droneOn() { return droneOn; } };
})();
