/**
 * Servexa AI - Web Audio API Full-Duplex Engine & PBX VoIP Sound System
 * 
 * Features:
 * - Single-click full-duplex AudioContext unlock (ensures browser user-gesture restrictions are cleared)
 * - Microphone stream capture connected to AnalyserNode for live waveform/equalizer visualization
 * - Real-time Speech Activity Detection (SAD) with configurable RMS energy threshold & silence detection
 * - Vocal dynamics compressor & speech bandpass filter
 * - Multi-persona Web Speech synthesis with customizable rate & pitch
 * - PBX ringtone & DTMF signaling
 */

export interface VoicePersona {
  id: string;
  name: string;
  description: string;
  pitch: number;
  rate: number;
  gender: 'female' | 'male';
}

export const VOICE_PERSONAS: VoicePersona[] = [
  {
    id: 'sophia',
    name: 'Sophia',
    description: 'Warm & Friendly Concierge',
    pitch: 1.05,
    rate: 1.02,
    gender: 'female'
  },
  {
    id: 'marcus',
    name: 'Marcus',
    description: 'Executive Rapid Dispatcher',
    pitch: 0.92,
    rate: 1.04,
    gender: 'male'
  },
  {
    id: 'elena',
    name: 'Elena',
    description: 'Technical & Support Specialist',
    pitch: 1.10,
    rate: 1.08,
    gender: 'female'
  },
  {
    id: 'david',
    name: 'David',
    description: 'Master Craftsman & Advisor',
    pitch: 0.85,
    rate: 0.96,
    gender: 'male'
  }
];

class PBXAudioEngine {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private sadInterval: number | null = null;
  private isSadSpeaking: boolean = false;
  private silenceTimer: number = 0;
  private ringtoneInterval: number | null = null;

  // Ensure AudioContext is unlocked synchronously on the user's click gesture
  public ensureContext(): AudioContext | null {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch((e) => console.debug('AudioContext resume notice:', e));
    }
    return this.audioCtx;
  }

  // Full-Duplex communication channel initialization on a single click
  public async startFullDuplexChannel(options?: {
    onSpeechStart?: () => void;
    onSpeechEnd?: (silenceDurationMs: number) => void;
    silenceThresholdMs?: number;
    energyThreshold?: number;
  }): Promise<{ analyser: AnalyserNode | null; stream: MediaStream | null }> {
    this.ensureContext();
    if (!this.audioCtx) return { analyser: null, stream: null };

    const silenceThresholdMs = options?.silenceThresholdMs ?? 1600;
    const energyThreshold = options?.energyThreshold ?? 0.015;

    // Create high-resolution AnalyserNode for live waveforms
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 128;
    this.analyser.smoothingTimeConstant = 0.8;

    // Vocal clarity bandpass filter
    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1750, this.audioCtx.currentTime);
    filter.Q.setValueAtTime(0.7, this.audioCtx.currentTime);

    // Vocal dynamics compressor
    const compressor = this.audioCtx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-24, this.audioCtx.currentTime);
    compressor.knee.setValueAtTime(30, this.audioCtx.currentTime);
    compressor.ratio.setValueAtTime(12, this.audioCtx.currentTime);

    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        this.micStream = stream;
        this.micSource = this.audioCtx.createMediaStreamSource(stream);

        // Chain: Mic -> Filter -> Compressor -> Analyser
        this.micSource.connect(filter);
        filter.connect(compressor);
        compressor.connect(this.analyser);

        // Launch Web Audio Speech Activity Detection (SAD)
        this.startSpeechActivityDetection(silenceThresholdMs, energyThreshold, options?.onSpeechStart, options?.onSpeechEnd);

        return { analyser: this.analyser, stream: this.micStream };
      }
    } catch (err) {
      console.warn('Microphone permission not granted or unavailable:', err);
    }

    return { analyser: this.analyser, stream: null };
  }

  // Real-time Speech Activity Detection (SAD) using Root-Mean-Square (RMS) analysis
  private startSpeechActivityDetection(
    silenceThresholdMs: number,
    energyThreshold: number,
    onSpeechStart?: () => void,
    onSpeechEnd?: (silenceDurationMs: number) => void
  ) {
    if (this.sadInterval) {
      clearInterval(this.sadInterval);
    }

    const sampleBuffer = new Float32Array(this.analyser?.fftSize || 128);
    const intervalMs = 100;
    this.silenceTimer = 0;
    this.isSadSpeaking = false;

    this.sadInterval = window.setInterval(() => {
      if (!this.analyser) return;

      this.analyser.getFloatTimeDomainData(sampleBuffer);

      // Compute RMS energy
      let sumSquares = 0;
      for (let i = 0; i < sampleBuffer.length; i++) {
        sumSquares += sampleBuffer[i] * sampleBuffer[i];
      }
      const rms = Math.sqrt(sumSquares / sampleBuffer.length);

      if (rms > energyThreshold) {
        // User is vocalizing
        this.silenceTimer = 0;
        if (!this.isSadSpeaking) {
          this.isSadSpeaking = true;
          onSpeechStart?.();
        }
      } else {
        // Silence or low background noise
        if (this.isSadSpeaking) {
          this.silenceTimer += intervalMs;
          if (this.silenceTimer >= silenceThresholdMs) {
            this.isSadSpeaking = false;
            onSpeechEnd?.(this.silenceTimer);
            this.silenceTimer = 0;
          }
        }
      }
    }, intervalMs);
  }

  // Get current frequency data array for animated visual equalizer
  public getFrequencyData(buffer: Uint8Array): void {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(buffer);
    }
  }

  // Get current RMS amplitude (0.0 to 1.0) for visual pulsing rings
  public getCurrentRms(): number {
    if (!this.analyser) return 0;
    const sampleBuffer = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(sampleBuffer);
    let sumSquares = 0;
    for (let i = 0; i < sampleBuffer.length; i++) {
      sumSquares += sampleBuffer[i] * sampleBuffer[i];
    }
    return Math.min(1, Math.sqrt(sumSquares / sampleBuffer.length) * 4);
  }

  // Speak aloud with customizable persona & rate
  public speakWithPersona(
    text: string,
    personaId: string = 'sophia',
    playbackSpeed: number = 1.0,
    callbacks?: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: () => void;
    }
  ) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[\*\#\_]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);

      const persona = VOICE_PERSONAS.find((p) => p.id === personaId) || VOICE_PERSONAS[0];
      utterance.pitch = persona.pitch;
      utterance.rate = persona.rate * playbackSpeed;

      // Select suitable system voice matching gender preference if available
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const preferredVoice = voices.find(
          (v) =>
            v.lang.startsWith('en') &&
            (persona.gender === 'female'
              ? v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('samantha') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('victoria')
              : v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('george'))
        ) || voices.find((v) => v.lang.startsWith('en')) || voices[0];

        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
      }

      utterance.onstart = () => callbacks?.onStart?.();
      utterance.onend = () => callbacks?.onEnd?.();
      utterance.onerror = () => callbacks?.onError?.();

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.debug('Speech synthesis note:', e);
      callbacks?.onError?.();
    }
  }

  // Start voice session for PBX VoIP calls
  public async startVoiceSession(useMicrophone: boolean = true): Promise<AnalyserNode | null> {
    const result = await this.startFullDuplexChannel();
    return result.analyser;
  }

  // Speak remote voice during PBX call
  public speakRemoteVoice(text: string) {
    this.speakWithPersona(text, 'sophia', 1.0);
  }

  // End voice session for PBX call or AI assistant
  public endVoiceSession() {
    this.endFullDuplexChannel();
  }

  // Play DTMF keypad tone
  public playDTMF(digit: string) {
    try {
      this.ensureContext();
      if (!this.audioCtx) return;

      const dtmfFrequencies: Record<string, [number, number]> = {
        '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
        '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
        '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
        '*': [941, 1209], '0': [941, 1336], '#': [941, 1477],
      };

      const freqs = dtmfFrequencies[digit] || [700, 1200];
      const now = this.audioCtx.currentTime;

      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc1.frequency.setValueAtTime(freqs[0], now);
      osc2.frequency.setValueAtTime(freqs[1], now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.18);
      osc2.stop(now + 0.18);
    } catch (e) {
      console.warn('DTMF audio error:', e);
    }
  }

  // Play PBX incoming or outgoing ring chime
  public startRingtone(type: 'incoming' | 'outgoing' = 'incoming') {
    try {
      this.ensureContext();
      if (!this.audioCtx) return;

      this.stopRingtone();

      const playBurst = () => {
        if (!this.audioCtx) return;
        const now = this.audioCtx.currentTime;

        const osc1 = this.audioCtx.createOscillator();
        const osc2 = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc1.frequency.setValueAtTime(type === 'incoming' ? 440 : 400, now);
        osc2.frequency.setValueAtTime(type === 'incoming' ? 480 : 450, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.08, now + 0.05);
        gain.gain.setValueAtTime(0.08, now + 1.2);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.5);
        osc2.stop(now + 1.5);
      };

      playBurst();
      this.ringtoneInterval = window.setInterval(playBurst, 3200);
    } catch (e) {
      console.warn('Audio tone error:', e);
    }
  }

  public stopRingtone() {
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
  }

  // Play pleasant incoming order chime for providers
  public playIncomingOrderChime() {
    try {
      this.ensureContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 chime

      notes.forEach((freq, idx) => {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        const noteStart = now + idx * 0.12;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.001, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.12, noteStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.35);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.35);
      });
    } catch (e) {
      console.warn('Chime audio notice:', e);
    }
  }

  // End active full-duplex session
  public endFullDuplexChannel() {
    if (this.sadInterval) {
      clearInterval(this.sadInterval);
      this.sadInterval = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    if (this.micSource) {
      try { this.micSource.disconnect(); } catch (e) {}
      this.micSource = null;
    }
    this.analyser = null;
  }
}

export const pbxAudio = new PBXAudioEngine();
