// Procedural Audio System for Vibe Coder
// Generates retro-style sound effects using Web Audio API

let audioContext = null;
let masterGain = null;
let musicGain = null;
let sfxGain = null;
let isMusicPlaying = false;
let musicOscillators = [];
let currentTrack = 0;
let musicTimeouts = [];

// Initialize audio context (must be called after user interaction)
export function initAudio() {
  if (audioContext) return;

  audioContext = new (window.AudioContext || window.webkitAudioContext)();

  // Master gain
  masterGain = audioContext.createGain();
  masterGain.gain.value = 0.3;
  masterGain.connect(audioContext.destination);

  // Separate gains for music and SFX
  musicGain = audioContext.createGain();
  musicGain.gain.value = 0.15;
  musicGain.connect(masterGain);

  sfxGain = audioContext.createGain();
  sfxGain.gain.value = 0.5;
  sfxGain.connect(masterGain);

  console.log('🔊 Audio system initialized');
}

// Resume audio context if suspended
export function resumeAudio() {
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume();
  }
}

// === SOUND EFFECT GENERATORS ===

// Player shoot sound - quick blip
export function playShoot() {
  if (!audioContext) return;
  if (!window.VIBE_SETTINGS?.sfxEnabled) return;

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(880, audioContext.currentTime);
  osc.frequency.exponentialRampToValueAtTime(220, audioContext.currentTime + 0.1);

  gain.gain.setValueAtTime(0.3, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

  osc.connect(gain);
  gain.connect(sfxGain);

  osc.start();
  osc.stop(audioContext.currentTime + 0.1);
}

// Enemy hit sound - thud
export function playHit() {
  if (!audioContext) return;
  if (!window.VIBE_SETTINGS?.sfxEnabled) return;

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(200, audioContext.currentTime);
  osc.frequency.exponentialRampToValueAtTime(80, audioContext.currentTime + 0.08);

  gain.gain.setValueAtTime(0.4, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);

  osc.connect(gain);
  gain.connect(sfxGain);

  osc.start();
  osc.stop(audioContext.currentTime + 0.08);
}

// Enemy death sound - explosion
export function playEnemyDeath() {
  if (!audioContext) return;
  if (!window.VIBE_SETTINGS?.sfxEnabled) return;

  // Noise burst for explosion
  const bufferSize = audioContext.sampleRate * 0.2;
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }

  const noise = audioContext.createBufferSource();
  noise.buffer = buffer;

  const filter = audioContext.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1000, audioContext.currentTime);
  filter.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.2);

  const gain = audioContext.createGain();
  gain.gain.setValueAtTime(0.3, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(sfxGain);

  noise.start();
}

// Boss death - big explosion
export function playBossDeath() {
  if (!audioContext) return;
  if (!window.VIBE_SETTINGS?.sfxEnabled) return;

  // Multiple layered explosions
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      const bufferSize = audioContext.sampleRate * 0.4;
      const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const data = buffer.getChannelData(0);

      for (let j = 0; j < bufferSize; j++) {
        data[j] = (Math.random() * 2 - 1) * (1 - j / bufferSize);
      }

      const noise = audioContext.createBufferSource();
      noise.buffer = buffer;

      const filter = audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800 - i * 200, audioContext.currentTime);
      filter.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.4);

      const gain = audioContext.createGain();
      gain.gain.setValueAtTime(0.5, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(sfxGain);

      noise.start();
    }, i * 100);
  }
}

// Player damage sound
export function playPlayerHit() {
  if (!audioContext) return;
  if (!window.VIBE_SETTINGS?.sfxEnabled) return;

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(150, audioContext.currentTime);
  osc.frequency.setValueAtTime(100, audioContext.currentTime + 0.1);
  osc.frequency.setValueAtTime(150, audioContext.currentTime + 0.2);

  gain.gain.setValueAtTime(0.3, audioContext.currentTime);
  gain.gain.linearRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

  osc.connect(gain);
  gain.connect(sfxGain);

  osc.start();
  osc.stop(audioContext.currentTime + 0.3);
}

// Level up fanfare
export function playLevelUp() {
  if (!audioContext) return;
  if (!window.VIBE_SETTINGS?.sfxEnabled) return;

  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

  notes.forEach((freq, i) => {
    setTimeout(() => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.type = 'square';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0.2, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(sfxGain);

      osc.start();
      osc.stop(audioContext.currentTime + 0.3);
    }, i * 100);
  });
}

// Weapon pickup sound
export function playWeaponPickup() {
  if (!audioContext) return;
  if (!window.VIBE_SETTINGS?.sfxEnabled) return;

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, audioContext.currentTime);
  osc.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.1);
  osc.frequency.exponentialRampToValueAtTime(1760, audioContext.currentTime + 0.15);

  gain.gain.setValueAtTime(0.3, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

  osc.connect(gain);
  gain.connect(sfxGain);

  osc.start();
  osc.stop(audioContext.currentTime + 0.2);
}

// Evolution sound - epic!
export function playEvolution() {
  if (!audioContext) return;
  if (!window.VIBE_SETTINGS?.sfxEnabled) return;

  // Ascending arpeggio
  const notes = [261.63, 329.63, 392, 523.25, 659.25, 783.99, 1046.50];

  notes.forEach((freq, i) => {
    setTimeout(() => {
      const osc = audioContext.createOscillator();
      const osc2 = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.type = 'square';
      osc.frequency.value = freq;
      osc2.type = 'sine';
      osc2.frequency.value = freq * 2;

      gain.gain.setValueAtTime(0.15, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(sfxGain);

      osc.start();
      osc2.start();
      osc.stop(audioContext.currentTime + 0.4);
      osc2.stop(audioContext.currentTime + 0.4);
    }, i * 80);
  });
}

// XP gain - subtle blip
export function playXPGain() {
  if (!audioContext) return;
  if (!window.VIBE_SETTINGS?.sfxEnabled) return;

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(1200, audioContext.currentTime);
  osc.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.05);

  gain.gain.setValueAtTime(0.1, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);

  osc.connect(gain);
  gain.connect(sfxGain);

  osc.start();
  osc.stop(audioContext.currentTime + 0.05);
}

// Wave complete sound
export function playWaveComplete() {
  if (!audioContext) return;
  if (!window.VIBE_SETTINGS?.sfxEnabled) return;

  const notes = [392, 523.25, 659.25]; // G4, C5, E5

  notes.forEach((freq, i) => {
    setTimeout(() => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.type = 'triangle';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0.25, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(sfxGain);

      osc.start();
      osc.stop(audioContext.currentTime + 0.3);
    }, i * 150);
  });
}

// Boss spawn warning
export function playBossWarning() {
  if (!audioContext) return;
  if (!window.VIBE_SETTINGS?.sfxEnabled) return;

  // Low rumble + warning beeps
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.type = 'sawtooth';
      osc.frequency.value = 80;

      gain.gain.setValueAtTime(0.3, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(sfxGain);

      osc.start();
      osc.stop(audioContext.currentTime + 0.2);
    }, i * 300);
  }
}

// rm -rf nuke sound
export function playNuke() {
  if (!audioContext) return;
  if (!window.VIBE_SETTINGS?.sfxEnabled) return;

  // Rising tone into massive explosion
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(100, audioContext.currentTime);
  osc.frequency.exponentialRampToValueAtTime(2000, audioContext.currentTime + 0.5);

  gain.gain.setValueAtTime(0.3, audioContext.currentTime);
  gain.gain.setValueAtTime(0.4, audioContext.currentTime + 0.5);
  gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);

  osc.connect(gain);
  gain.connect(sfxGain);

  osc.start();
  osc.stop(audioContext.currentTime + 1);

  // Add explosion after rise
  setTimeout(() => {
    playBossDeath();
  }, 500);
}

// Magnet sound
export function playMagnet() {
  if (!audioContext) return;
  if (!window.VIBE_SETTINGS?.sfxEnabled) return;

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(300, audioContext.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1500, audioContext.currentTime + 0.3);
  osc.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.5);

  gain.gain.setValueAtTime(0.2, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

  osc.connect(gain);
  gain.connect(sfxGain);

  osc.start();
  osc.stop(audioContext.currentTime + 0.5);
}

// === BACKGROUND MUSIC ===

// Track definitions
const TRACKS = [
  { name: 'DEBUG ZONE', bpm: 140, bassPattern: [0, 0, 7, 7, 5, 5, 3, 3], arpPattern: [0, 4, 7, 12, 7, 4], bassRoot: 110, arpRoot: 220, bassType: 'square', arpType: 'triangle' },
  { name: 'MEMORY BANKS', bpm: 128, bassPattern: [0, 0, 5, 5, 7, 7, 10, 10], arpPattern: [0, 3, 7, 10, 12, 10, 7, 3], bassRoot: 82.4, arpRoot: 329.63, bassType: 'sawtooth', arpType: 'sine' },
  { name: 'NETWORK LAYER', bpm: 150, bassPattern: [0, 0, 0, 5, 7, 7, 5, 3], arpPattern: [0, 5, 7, 12, 5, 7, 12, 17], bassRoot: 98, arpRoot: 196, bassType: 'square', arpType: 'square' },
  { name: 'KERNEL SPACE', bpm: 160, bassPattern: [0, 3, 5, 0, 7, 5, 3, 0], arpPattern: [0, 4, 7, 11, 12, 11, 7, 4], bassRoot: 73.4, arpRoot: 293.66, bassType: 'sawtooth', arpType: 'triangle' },
  { name: 'BOSS FIGHT', bpm: 170, bassPattern: [0, 0, 12, 12, 0, 0, 10, 10], arpPattern: [0, 3, 6, 9, 12, 9, 6, 3], bassRoot: 55, arpRoot: 220, bassType: 'sawtooth', arpType: 'sawtooth' }
];

// Chiptune-style background music
export function startMusic(trackIndex = 0) {
  if (!audioContext) return;

  // Stop current music first
  if (isMusicPlaying) {
    stopMusic();
  }

  isMusicPlaying = true;
  currentTrack = trackIndex % TRACKS.length;
  const track = TRACKS[currentTrack];

  const bpm = track.bpm;
  const beatDuration = 60 / bpm;
  const sixteenthDuration = beatDuration / 4;

  let bassIndex = 0;
  let arpIndex = 0;

  function playBass() {
    if (!isMusicPlaying) return;

    const semitone = track.bassPattern[bassIndex % track.bassPattern.length];
    const freq = track.bassRoot * Math.pow(2, semitone / 12);

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.type = track.bassType;
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0.15, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + beatDuration * 0.9);

    osc.connect(gain);
    gain.connect(musicGain);

    osc.start();
    osc.stop(audioContext.currentTime + beatDuration);

    bassIndex++;
    const timeout = setTimeout(playBass, beatDuration * 1000);
    musicTimeouts.push(timeout);
  }

  function playArp() {
    if (!isMusicPlaying) return;

    const semitone = track.arpPattern[arpIndex % track.arpPattern.length];
    const freq = track.arpRoot * Math.pow(2, semitone / 12);

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.type = track.arpType;
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0.08, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + sixteenthDuration * 0.8);

    osc.connect(gain);
    gain.connect(musicGain);

    osc.start();
    osc.stop(audioContext.currentTime + sixteenthDuration);

    arpIndex++;
    const timeout = setTimeout(playArp, sixteenthDuration * 1000);
    musicTimeouts.push(timeout);
  }

  // Hi-hat pattern
  function playHiHat() {
    if (!isMusicPlaying) return;

    const bufferSize = audioContext.sampleRate * 0.05;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = audioContext.createBufferSource();
    noise.buffer = buffer;

    const filter = audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 8000;

    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0.05, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(musicGain);

    noise.start();

    const timeout = setTimeout(playHiHat, sixteenthDuration * 1000);
    musicTimeouts.push(timeout);
  }

  // Kick drum (for faster tracks)
  function playKick() {
    if (!isMusicPlaying) return;

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, audioContext.currentTime + 0.1);

    gain.gain.setValueAtTime(0.2, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(musicGain);

    osc.start();
    osc.stop(audioContext.currentTime + 0.15);

    const timeout = setTimeout(playKick, beatDuration * 1000);
    musicTimeouts.push(timeout);
  }

  // Start all parts
  playBass();
  musicTimeouts.push(setTimeout(playArp, 100));
  musicTimeouts.push(setTimeout(playHiHat, 50));
  if (bpm >= 150) {
    musicTimeouts.push(setTimeout(playKick, 200));
  }

  console.log(`🎵 Music started: ${track.name}`);
}

export function stopMusic() {
  isMusicPlaying = false;
  // Clear all music timeouts
  musicTimeouts.forEach(t => clearTimeout(t));
  musicTimeouts = [];
  console.log('🎵 Music stopped');
}

export function toggleMusic() {
  if (isMusicPlaying) {
    stopMusic();
  } else {
    startMusic(currentTrack);
  }
  return isMusicPlaying;
}

// Change to a specific track (0-4)
export function setTrack(trackIndex) {
  currentTrack = trackIndex % TRACKS.length;
  if (isMusicPlaying) {
    stopMusic();
    startMusic(currentTrack);
  }
}

// Get current track info
export function getCurrentTrack() {
  return { index: currentTrack, name: TRACKS[currentTrack].name };
}

export function getTrackCount() {
  return TRACKS.length;
}

// Volume controls
export function setMasterVolume(value) {
  if (masterGain) masterGain.gain.value = Math.max(0, Math.min(1, value));
}

export function setMusicVolume(value) {
  if (musicGain) musicGain.gain.value = Math.max(0, Math.min(1, value));
}

export function setSFXVolume(value) {
  if (sfxGain) sfxGain.gain.value = Math.max(0, Math.min(1, value));
}
