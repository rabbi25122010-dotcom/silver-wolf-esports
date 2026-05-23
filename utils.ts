/**
 * Plays a premium synthetic metallic "liquid glass" chime sound
 * using the Web Audio API without requiring external MP3 files.
 */
export function playGlassChime() {
  try {
    if ((window as any).soundEnabled === false) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    
    // Create base oscillators
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    
    // Low pass filter to make it warmer/sweeter
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, ctx.currentTime);
    
    // Gains for envelope
    const gainNode = ctx.createGain();
    
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5 (Chime base)
    
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1318.51, ctx.currentTime); // E6 (Bright high overtone)
    
    // Mix osc2 more quietly for sparkle
    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.3, ctx.currentTime);
    osc2.connect(osc2Gain);
    
    // Connect to main gain
    osc1.connect(gainNode);
    osc2Gain.connect(gainNode);
    
    gainNode.connect(filter);
    filter.connect(ctx.destination);
    
    // Envelope: quick attack, medium-fast decay for "glassy tink"
    const now = ctx.currentTime;
    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(0.4, now + 0.02); // crisp click
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.2); // long glassy fade
    
    osc1.start(now);
    osc2.start(now);
    
    osc1.stop(now + 1.3);
    osc2.stop(now + 1.3);
  } catch (error) {
    console.warn("Audio Context failed to play: user interaction might be required first", error);
  }
}

/**
 * Persists data to localStorage with simple prefix
 */
export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const val = localStorage.getItem(`slw_${key}`);
      return val ? JSON.parse(val) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set: (key: string, value: any): void => {
    try {
      localStorage.setItem(`slw_${key}`, JSON.stringify(value));
    } catch (e) {
      console.error(e);
    }
  }
};
