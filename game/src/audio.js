// audio.js — every sound is synthesized with Web Audio, so the game
// ships no audio files. A tiny helper builds short tones; the game
// calls the named sounds and never touches the context directly.

export class SoundBank {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.alarmOsc = null;
  }

  // Browsers only allow audio after a gesture; call this from the first
  // key or click and everything after it just works.
  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AudioCtx = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.16;
    this.master.connect(this.ctx.destination);
  }

  tone(freq, seconds, type = 'sine', when = 0, slideTo = null) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + seconds);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(1, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + seconds + 0.05);
  }

  step() {
    this.tone(90, 0.05, 'triangle');
  }

  clink() {
    this.tone(2093, 0.12, 'sine');
    this.tone(2637, 0.1, 'sine', 0.05);
  }

  pickup() {
    this.tone(880, 0.09, 'sine');
    this.tone(1318, 0.12, 'sine', 0.07);
  }

  vaultCrack() {
    this.tone(523, 0.12, 'triangle');
    this.tone(659, 0.12, 'triangle', 0.1);
    this.tone(784, 0.2, 'triangle', 0.2);
  }

  spotted() {
    this.tone(220, 0.25, 'sawtooth', 0, 440);
  }

  caught() {
    this.tone(196, 0.4, 'sawtooth', 0, 98);
    this.tone(147, 0.5, 'sawtooth', 0.15, 73);
  }

  laserTrip() {
    this.tone(1200, 0.15, 'square', 0, 300);
  }

  success() {
    [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.18, 'triangle', i * 0.09));
  }

  click() {
    this.tone(660, 0.05, 'square');
  }
}
