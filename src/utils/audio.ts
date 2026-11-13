import { soundMixerStore, lightningFlashStore, weatherStore } from '../stores/appStore';

class ProceduralAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private pinkNoiseBuffer: AudioBuffer | null = null;
  private brownNoiseBuffer: AudioBuffer | null = null;

  // Rain nodes
  private rainSource: AudioBufferSourceNode | null = null;
  private rainGain: GainNode | null = null;
  private rainFilter: BiquadFilterNode | null = null;

  // Wind / Trees nodes
  private treesSource: AudioBufferSourceNode | null = null;
  private treesGain: GainNode | null = null;
  private treesFilter: BiquadFilterNode | null = null;
  private treesLFO: OscillatorNode | null = null;

  // Waves nodes
  private wavesSource: AudioBufferSourceNode | null = null;
  private wavesGain: GainNode | null = null;
  private wavesLfoGain: GainNode | null = null;
  private wavesFilter: BiquadFilterNode | null = null;
  private wavesLFO: OscillatorNode | null = null;

  // Birds state & timers
  private birdsGain: GainNode | null = null;
  private birdsTimer: ReturnType<typeof setTimeout> | null = null;

  // Thunder state & timers
  private thunderGain: GainNode | null = null;
  private thunderTimer: ReturnType<typeof setTimeout> | null = null;
  private flashTimeouts: ReturnType<typeof setTimeout>[] = [];

  private isInitialized = false;

  public clearLightning(): void {
    this.flashTimeouts.forEach((t) => clearTimeout(t));
    this.flashTimeouts = [];
    lightningFlashStore.set(false);
  }

  public async init(): Promise<void> {
    if (this.isInitialized) {
      if (this.ctx && this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);

      this.generateNoiseBuffers();
      this.setupRainChannel();
      this.setupTreesChannel();
      this.setupWavesChannel();
      this.setupBirdsChannel();
      this.setupThunderChannel();

      this.isInitialized = true;
      this.syncWithStore();

      // Listen for sound store updates
      soundMixerStore.subscribe((state) => {
        this.updateFromStore(state);
        // If thunder turned off, clear any active timers/flashes
        if (!state.thunder.on) {
          if (this.thunderTimer) {
            clearTimeout(this.thunderTimer);
            this.thunderTimer = null;
          }
          this.clearLightning();
        } else if (weatherStore.get() === 'thunder' && !this.thunderTimer) {
          this.scheduleNextThunder();
        }
      });

      // Strict Weather Isolation listener: Immediately clear thunder/lightning when leaving 'thunder'
      weatherStore.subscribe((weather) => {
        if (weather !== 'thunder') {
          if (this.thunderTimer) {
            clearTimeout(this.thunderTimer);
            this.thunderTimer = null;
          }
          this.clearLightning();
        } else {
          const soundState = soundMixerStore.get();
          if (soundState.thunder.on && !this.thunderTimer) {
            this.scheduleNextThunder();
          }
        }
      });
    } catch (e) {
      console.warn('AudioContext initialization deferred until user interaction:', e);
    }
  }

  private generateNoiseBuffers(): void {
    if (!this.ctx) return;
    const sampleRate = this.ctx.sampleRate;
    const duration = 6; // 6 seconds loop
    const frameCount = sampleRate * duration;

    // Pink Noise Buffer
    this.pinkNoiseBuffer = this.ctx.createBuffer(1, frameCount, sampleRate);
    const pinkData = this.pinkNoiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < frameCount; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      pinkData[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    // Brown Noise Buffer
    this.brownNoiseBuffer = this.ctx.createBuffer(1, frameCount, sampleRate);
    const brownData = this.brownNoiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < frameCount; i++) {
      const white = Math.random() * 2 - 1;
      brownData[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = brownData[i];
      brownData[i] *= 3.5; // compensation
    }
  }

  // --- Rain Channel ---
  private setupRainChannel(): void {
    if (!this.ctx || !this.masterGain || !this.pinkNoiseBuffer) return;

    this.rainFilter = this.ctx.createBiquadFilter();
    this.rainFilter.type = 'lowpass';
    this.rainFilter.frequency.value = 1400;

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.value = 0;

    this.rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.masterGain);

    this.startRainLoop();
  }

  private startRainLoop(): void {
    if (!this.ctx || !this.pinkNoiseBuffer || !this.rainFilter) return;
    this.rainSource = this.ctx.createBufferSource();
    this.rainSource.buffer = this.pinkNoiseBuffer;
    this.rainSource.loop = true;
    this.rainSource.connect(this.rainFilter);
    this.rainSource.start(0);
  }

  // --- Trees / Wind Channel ---
  private setupTreesChannel(): void {
    if (!this.ctx || !this.masterGain || !this.pinkNoiseBuffer) return;

    this.treesFilter = this.ctx.createBiquadFilter();
    this.treesFilter.type = 'bandpass';
    this.treesFilter.frequency.value = 450;
    this.treesFilter.Q.value = 1.8;

    this.treesGain = this.ctx.createGain();
    this.treesGain.gain.value = 0;

    // LFO to modulate wind frequency
    this.treesLFO = this.ctx.createOscillator();
    this.treesLFO.frequency.value = 0.15; // slow swaying
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 180; // swing +-180Hz

    this.treesLFO.connect(lfoGain);
    lfoGain.connect(this.treesFilter.frequency);
    this.treesLFO.start(0);

    this.treesFilter.connect(this.treesGain);
    this.treesGain.connect(this.masterGain);

    this.startTreesLoop();
  }

  private startTreesLoop(): void {
    if (!this.ctx || !this.pinkNoiseBuffer || !this.treesFilter) return;
    this.treesSource = this.ctx.createBufferSource();
    this.treesSource.buffer = this.pinkNoiseBuffer;
    this.treesSource.loop = true;
    this.treesSource.connect(this.treesFilter);
    this.treesSource.start(0);
  }

  // --- Waves Channel ---
  private setupWavesChannel(): void {
    if (!this.ctx || !this.masterGain || !this.pinkNoiseBuffer) return;

    this.wavesFilter = this.ctx.createBiquadFilter();
    this.wavesFilter.type = 'lowpass';
    this.wavesFilter.frequency.value = 650;

    this.wavesLfoGain = this.ctx.createGain();
    this.wavesLfoGain.gain.value = 0.5;

    this.wavesGain = this.ctx.createGain();
    this.wavesGain.gain.value = 0;

    // LFO for periodic wave swelling (period ~9s)
    this.wavesLFO = this.ctx.createOscillator();
    this.wavesLFO.frequency.value = 0.11; // ~9s cycle

    const lfoAmp = this.ctx.createGain();
    lfoAmp.gain.value = 0.45;
    this.wavesLFO.connect(lfoAmp);
    lfoAmp.connect(this.wavesLfoGain.gain);
    this.wavesLFO.start(0);

    this.wavesFilter.connect(this.wavesLfoGain);
    this.wavesLfoGain.connect(this.wavesGain);
    this.wavesGain.connect(this.masterGain);

    this.startWavesLoop();
  }

  private startWavesLoop(): void {
    if (!this.ctx || !this.pinkNoiseBuffer || !this.wavesFilter) return;
    this.wavesSource = this.ctx.createBufferSource();
    this.wavesSource.buffer = this.pinkNoiseBuffer;
    this.wavesSource.loop = true;
    this.wavesSource.connect(this.wavesFilter);
    this.wavesSource.start(0);
  }

  // --- Birds Channel ---
  private setupBirdsChannel(): void {
    if (!this.ctx || !this.masterGain) return;
    this.birdsGain = this.ctx.createGain();
    this.birdsGain.gain.value = 0;
    this.birdsGain.connect(this.masterGain);
    this.scheduleNextBirdChirp();
  }

  private scheduleNextBirdChirp(): void {
    if (this.birdsTimer) clearTimeout(this.birdsTimer);
    const delay = 2500 + Math.random() * 4500;
    this.birdsTimer = setTimeout(() => {
      this.playProceduralBirdChirp();
      this.scheduleNextBirdChirp();
    }, delay);
  }

  private playProceduralBirdChirp(): void {
    if (!this.ctx || !this.birdsGain || !this.isInitialized) return;
    const soundState = soundMixerStore.get();
    if (!soundState.birds.on || soundState.birds.volume <= 0) return;

    const now = this.ctx.currentTime;
    const chirpsCount = 1 + Math.floor(Math.random() * 3);

    for (let c = 0; c < chirpsCount; c++) {
      const chirpStart = now + c * (0.12 + Math.random() * 0.08);
      const chirpDuration = 0.07 + Math.random() * 0.05;

      const carrier = this.ctx.createOscillator();
      const modulator = this.ctx.createOscillator();
      const modGain = this.ctx.createGain();
      const chirpGain = this.ctx.createGain();

      const baseFreq = 2600 + Math.random() * 1200;
      carrier.type = 'sine';
      carrier.frequency.setValueAtTime(baseFreq, chirpStart);
      carrier.frequency.exponentialRampToValueAtTime(baseFreq + 600 + Math.random() * 400, chirpStart + chirpDuration * 0.5);
      carrier.frequency.exponentialRampToValueAtTime(baseFreq - 200, chirpStart + chirpDuration);

      modulator.type = 'sine';
      modulator.frequency.setValueAtTime(80 + Math.random() * 60, chirpStart);
      modGain.gain.setValueAtTime(120, chirpStart);

      modulator.connect(carrier.frequency);

      chirpGain.gain.setValueAtTime(0.001, chirpStart);
      chirpGain.gain.exponentialRampToValueAtTime(0.25, chirpStart + 0.02);
      chirpGain.gain.exponentialRampToValueAtTime(0.001, chirpStart + chirpDuration);

      carrier.connect(chirpGain);
      chirpGain.connect(this.birdsGain);

      carrier.start(chirpStart);
      modulator.start(chirpStart);
      carrier.stop(chirpStart + chirpDuration + 0.05);
      modulator.stop(chirpStart + chirpDuration + 0.05);
    }
  }

  // --- Thunder Channel ---
  private setupThunderChannel(): void {
    if (!this.ctx || !this.masterGain) return;
    this.thunderGain = this.ctx.createGain();
    this.thunderGain.gain.value = 0;
    this.thunderGain.connect(this.masterGain);
    if (weatherStore.get() === 'thunder' && soundMixerStore.get().thunder.on) {
      this.scheduleNextThunder();
    }
  }

  private scheduleNextThunder(): void {
    if (this.thunderTimer) {
      clearTimeout(this.thunderTimer);
      this.thunderTimer = null;
    }
    const weather = weatherStore.get();
    const soundState = soundMixerStore.get();
    if (weather !== 'thunder' || !soundState.thunder.on) {
      this.clearLightning();
      return;
    }
    const delay = 12000 + Math.random() * 14000;
    this.thunderTimer = setTimeout(() => {
      if (weatherStore.get() === 'thunder' && soundMixerStore.get().thunder.on) {
        this.triggerThunderProcedural();
        this.scheduleNextThunder();
      } else {
        this.clearLightning();
      }
    }, delay);
  }

  public triggerThunderProcedural(): void {
    if (!this.ctx || !this.thunderGain || !this.brownNoiseBuffer) return;
    const soundState = soundMixerStore.get();
    const weather = weatherStore.get();
    
    // STRICT RULE: Lightning flashes and thunder audio MUST ONLY run when weather === 'thunder' AND soundState.thunder.on
    if (weather !== 'thunder' || !soundState.thunder.on) {
      this.clearLightning();
      return;
    }

    // Trigger visual lightning flash synced with thunder strictly during thunder mode
    this.clearLightning();
    lightningFlashStore.set(true);
    const t1 = setTimeout(() => {
      if (weatherStore.get() !== 'thunder') {
        this.clearLightning();
        return;
      }
      lightningFlashStore.set(false);
      // Secondary strike flicker
      const t2 = setTimeout(() => {
        if (weatherStore.get() !== 'thunder') {
          this.clearLightning();
          return;
        }
        lightningFlashStore.set(true);
        const t3 = setTimeout(() => {
          lightningFlashStore.set(false);
        }, 90);
        this.flashTimeouts.push(t3);
      }, 120);
      this.flashTimeouts.push(t2);
    }, 180);
    this.flashTimeouts.push(t1);

    const now = this.ctx.currentTime;

    // 1. Sharp crack (bandpass noise)
    const crackSource = this.ctx.createBufferSource();
    crackSource.buffer = this.brownNoiseBuffer;
    const crackFilter = this.ctx.createBiquadFilter();
    crackFilter.type = 'bandpass';
    crackFilter.frequency.setValueAtTime(1100, now);
    crackFilter.Q.setValueAtTime(3, now);

    const crackGain = this.ctx.createGain();
    crackGain.gain.setValueAtTime(0.001, now);
    crackGain.gain.linearRampToValueAtTime(0.7, now + 0.03);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    crackSource.connect(crackFilter);
    crackFilter.connect(crackGain);
    crackGain.connect(this.thunderGain);
    crackSource.start(now);
    crackSource.stop(now + 0.4);

    // 2. Rolling sub-bass echo (lowpass rumble)
    const rumbleSource = this.ctx.createBufferSource();
    rumbleSource.buffer = this.brownNoiseBuffer;
    const rumbleFilter = this.ctx.createBiquadFilter();
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.setValueAtTime(180, now + 0.1);
    rumbleFilter.frequency.exponentialRampToValueAtTime(65, now + 3.2);

    const rumbleGain = this.ctx.createGain();
    rumbleGain.gain.setValueAtTime(0.001, now + 0.05);
    rumbleGain.gain.linearRampToValueAtTime(0.95, now + 0.25);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 4.0);

    // Sub-oscillator for physical chest rumble
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(58, now + 0.1);
    subOsc.frequency.exponentialRampToValueAtTime(36, now + 3.0);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.001, now + 0.08);
    subGain.gain.linearRampToValueAtTime(0.55, now + 0.3);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 3.2);

    rumbleSource.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(this.thunderGain);

    subOsc.connect(subGain);
    subGain.connect(this.thunderGain);

    rumbleSource.start(now + 0.05);
    rumbleSource.stop(now + 4.2);

    subOsc.start(now + 0.08);
    subOsc.stop(now + 3.5);
  }

  // --- Pomodoro Chime ---
  public playChime(): void {
    if (!this.ctx || !this.masterGain) {
      this.init().then(() => this.playChime());
      return;
    }
    const now = this.ctx.currentTime;
    const frequencies = [528, 792, 1056]; // Harmonics

    frequencies.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      const amp = 0.28 / (idx + 1);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(amp, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8 + idx * 0.4);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 3.5);
    });
  }

  private syncWithStore(): void {
    const state = soundMixerStore.get();
    this.updateFromStore(state);
  }

  private updateFromStore(state: ReturnType<typeof soundMixerStore.get>): void {
    if (!this.ctx || !this.masterGain) return;

    const master = state.masterVolume / 100;
    this.masterGain.gain.setTargetAtTime(master, this.ctx.currentTime, 0.05);

    if (this.rainGain) {
      const vol = state.rain.on ? (state.rain.volume / 100) * 0.8 : 0;
      this.rainGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.08);
    }

    if (this.treesGain) {
      const vol = state.trees.on ? (state.trees.volume / 100) * 0.75 : 0;
      this.treesGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.08);
    }

    if (this.wavesGain) {
      const vol = state.waves.on ? (state.waves.volume / 100) * 0.85 : 0;
      this.wavesGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.08);
    }

    if (this.birdsGain) {
      const vol = state.birds.on ? (state.birds.volume / 100) * 0.9 : 0;
      this.birdsGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.08);
    }

    if (this.thunderGain) {
      const vol = state.thunder.on ? (state.thunder.volume / 100) * 0.95 : 0;
      this.thunderGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.08);
    }
  }
}

export const audioEngine = new ProceduralAudioEngine();

