/**
 * Web Audio API Sound Utility for MalVision Cybersecurity Application
 * Provides subtle, non-intrusive sound effects for scan events and actions.
 * Zero external mp3 dependencies — uses native Web Audio synth oscillators.
 */

export type SoundPackId = 'MalVision' | 'Minimal' | 'Classic' | 'Silent';
export type SoundEventType = 'click' | 'scan_start' | 'scan_success' | 'threat_detected' | 'notification' | 'error';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function isSoundEnabled(): boolean {
  return localStorage.getItem('malvision_pref_sound_enabled') !== 'false';
}

export function getSoundPack(): SoundPackId {
  const saved = localStorage.getItem('malvision_pref_sound_pack');
  if (saved === 'Minimal' || saved === 'Classic' || saved === 'Silent') {
    return saved;
  }
  return 'MalVision';
}

export function setSoundEnabled(enabled: boolean): void {
  localStorage.setItem('malvision_pref_sound_enabled', String(enabled));
}

export function setSoundPack(pack: SoundPackId): void {
  localStorage.setItem('malvision_pref_sound_pack', pack);
}

/**
 * Synthesizes a clean audio tone using Web Audio API
 */
export function playSound(type: SoundEventType, overridePack?: SoundPackId): void {
  if (!isSoundEnabled() && !overridePack) return;

  const pack = overridePack || getSoundPack();
  if (pack === 'Silent') return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (pack === 'MalVision') {
      switch (type) {
        case 'click':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, now);
          osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
          osc.start(now);
          osc.stop(now + 0.04);
          break;

        case 'scan_start':
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          osc.start(now);
          osc.stop(now + 0.12);
          break;

        case 'scan_success':
          // Two-tone arpeggio (E5 -> A5)
          osc.type = 'sine';
          osc.frequency.setValueAtTime(659.25, now); // E5
          osc.frequency.setValueAtTime(880, now + 0.08); // A5
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
          osc.start(now);
          osc.stop(now + 0.22);
          break;

        case 'threat_detected':
          // Warning tone (Sawtooth low drop)
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(350, now);
          osc.frequency.exponentialRampToValueAtTime(120, now + 0.25);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          osc.start(now);
          osc.stop(now + 0.25);
          break;

        case 'notification':
        default:
          osc.type = 'sine';
          osc.frequency.setValueAtTime(523.25, now); // C5
          osc.frequency.setValueAtTime(783.99, now + 0.06); // G5
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
          osc.start(now);
          osc.stop(now + 0.18);
          break;
      }
    } else if (pack === 'Minimal') {
      // Soft gentle sinewave
      osc.type = 'sine';
      const freq = type === 'threat_detected' ? 220 : type === 'scan_success' ? 880 : 587.33;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (pack === 'Classic') {
      // Retro terminal blip
      osc.type = 'square';
      const freq = type === 'threat_detected' ? 180 : type === 'scan_success' ? 1046.5 : 440;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
    }
  } catch (e) {
    // Ignore audio context errors gracefully
  }
}

/**
 * Preview audio tone for selected sound pack
 */
export function previewSoundPack(pack: SoundPackId): void {
  playSound('scan_success', pack);
}
