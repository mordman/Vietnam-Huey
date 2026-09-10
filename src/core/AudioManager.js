export class AudioManager {
  constructor() {
    this.context = null;
    this.master = null;
    this.engine = null;
    this.rotor = null;
    this.enabled = true;
  }

  init() {
    if (this.context) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) { this.enabled = false; return; }
    this.context = new AudioContext();
    this.master = this.context.createGain();
    this.master.gain.value = 0.08;
    this.master.connect(this.context.destination);
    this.engine = this.createTone(72, 0.04);
    this.rotor = this.createTone(118, 0.025);
  }

  createTone(frequency, volume) {
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = 'sawtooth';
    oscillator.frequency.value = frequency;
    gain.gain.value = volume;
    oscillator.connect(gain).connect(this.master);
    oscillator.start();
    return { oscillator, gain };
  }

  resume() {
    this.init();
    if (this.context?.state === 'suspended') this.context.resume();
  }

  update(speed = 0) {
    if (!this.enabled || !this.context) return;
    const intensity = Math.min(1, speed / 35);
    this.engine.oscillator.frequency.value = 65 + intensity * 35;
    this.rotor.oscillator.frequency.value = 105 + intensity * 40;
  }

  playShot() { this.playBurst(95, 0.12, 0.08); }
  playExplosion() { this.playBurst(42, 0.35, 0.3); }

  playBurst(frequency, duration, volume) {
    if (!this.enabled || !this.context) return;
    const tone = this.createTone(frequency, volume);
    tone.gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
    tone.oscillator.stop(this.context.currentTime + duration);
  }

  dispose() {
    this.engine?.oscillator.stop();
    this.rotor?.oscillator.stop();
    this.context?.close();
    this.context = null;
  }
}

export default AudioManager;