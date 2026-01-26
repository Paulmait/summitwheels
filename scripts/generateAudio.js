/**
 * Generate simple audio files for the game
 *
 * Run with: node scripts/generateAudio.js
 */

const fs = require('fs');
const path = require('path');

// Simple WAV file generator
function createWavFile(filename, frequency, duration, volume = 0.5) {
  const sampleRate = 44100;
  const numChannels = 1;
  const bitsPerSample = 16;
  const numSamples = Math.floor(sampleRate * duration);

  // Generate samples
  const samples = new Int16Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Simple sine wave with envelope
    const envelope = Math.min(1, Math.min(t * 20, (duration - t) * 20)); // Attack/release
    const sample = Math.sin(2 * Math.PI * frequency * t) * envelope * volume;
    samples[i] = Math.floor(sample * 32767);
  }

  // Create WAV header
  const dataSize = numSamples * numChannels * (bitsPerSample / 8);
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // chunk size
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
  buffer.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Write samples
  for (let i = 0; i < numSamples; i++) {
    buffer.writeInt16LE(samples[i], 44 + i * 2);
  }

  fs.writeFileSync(filename, buffer);
  console.log(`Created: ${filename}`);
}

// Create noise burst (for crash, landing)
function createNoiseFile(filename, duration, volume = 0.5) {
  const sampleRate = 44100;
  const numChannels = 1;
  const bitsPerSample = 16;
  const numSamples = Math.floor(sampleRate * duration);

  const samples = new Int16Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.exp(-t * 10) * volume; // Decay envelope
    const noise = (Math.random() * 2 - 1) * envelope;
    samples[i] = Math.floor(noise * 32767);
  }

  const dataSize = numSamples * numChannels * (bitsPerSample / 8);
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
  buffer.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    buffer.writeInt16LE(samples[i], 44 + i * 2);
  }

  fs.writeFileSync(filename, buffer);
  console.log(`Created: ${filename}`);
}

// Create chirp (for powerup, whoosh)
function createChirpFile(filename, startFreq, endFreq, duration, volume = 0.5) {
  const sampleRate = 44100;
  const numChannels = 1;
  const bitsPerSample = 16;
  const numSamples = Math.floor(sampleRate * duration);

  const samples = new Int16Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const freq = startFreq + (endFreq - startFreq) * (t / duration);
    const envelope = Math.min(1, Math.min(t * 20, (duration - t) * 20));
    const sample = Math.sin(2 * Math.PI * freq * t) * envelope * volume;
    samples[i] = Math.floor(sample * 32767);
  }

  const dataSize = numSamples * numChannels * (bitsPerSample / 8);
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
  buffer.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    buffer.writeInt16LE(samples[i], 44 + i * 2);
  }

  fs.writeFileSync(filename, buffer);
  console.log(`Created: ${filename}`);
}

// Create music loop (simple arpeggio)
function createMusicLoop(filename, duration) {
  const sampleRate = 44100;
  const numChannels = 1;
  const bitsPerSample = 16;
  const numSamples = Math.floor(sampleRate * duration);

  // Simple chord progression
  const notes = [261.63, 329.63, 392.00, 329.63]; // C4, E4, G4, E4
  const noteDuration = 0.5;

  const samples = new Int16Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const noteIndex = Math.floor((t / noteDuration) % notes.length);
    const freq = notes[noteIndex];
    const noteT = t % noteDuration;
    const envelope = Math.min(1, Math.min(noteT * 10, (noteDuration - noteT) * 5)) * 0.3;
    const sample = Math.sin(2 * Math.PI * freq * t) * envelope;
    samples[i] = Math.floor(sample * 32767);
  }

  const dataSize = numSamples * numChannels * (bitsPerSample / 8);
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
  buffer.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    buffer.writeInt16LE(samples[i], 44 + i * 2);
  }

  fs.writeFileSync(filename, buffer);
  console.log(`Created: ${filename}`);
}

// Ensure directories exist
const sfxDir = path.join(__dirname, '../assets/audio/sfx');
const musicDir = path.join(__dirname, '../assets/audio/music');

if (!fs.existsSync(sfxDir)) fs.mkdirSync(sfxDir, { recursive: true });
if (!fs.existsSync(musicDir)) fs.mkdirSync(musicDir, { recursive: true });

// Generate SFX files (as WAV, Expo will convert)
console.log('\nGenerating SFX...');
createWavFile(path.join(sfxDir, 'coin.wav'), 880, 0.1, 0.6);  // High ping
createChirpFile(path.join(sfxDir, 'powerup.wav'), 400, 800, 0.3, 0.5);  // Rising chirp
createNoiseFile(path.join(sfxDir, 'crash.wav'), 0.5, 0.8);  // Noise burst
createChirpFile(path.join(sfxDir, 'whoosh.wav'), 600, 200, 0.2, 0.4);  // Falling chirp
createWavFile(path.join(sfxDir, 'engine_start.wav'), 100, 0.3, 0.3);  // Low rumble
createWavFile(path.join(sfxDir, 'engine_loop.wav'), 150, 0.5, 0.2);  // Engine tone
createNoiseFile(path.join(sfxDir, 'brake.wav'), 0.2, 0.4);  // Short noise
createNoiseFile(path.join(sfxDir, 'landing.wav'), 0.15, 0.5);  // Thud
createWavFile(path.join(sfxDir, 'click.wav'), 1000, 0.05, 0.5);  // Quick click
createWavFile(path.join(sfxDir, 'switch.wav'), 800, 0.08, 0.4);  // Toggle
createChirpFile(path.join(sfxDir, 'confirm.wav'), 523, 784, 0.15, 0.5);  // Success chirp
createChirpFile(path.join(sfxDir, 'jingle.wav'), 523, 1047, 0.4, 0.5);  // Victory jingle

// Generate Music files
console.log('\nGenerating Music...');
createMusicLoop(path.join(musicDir, 'menu_theme.wav'), 8);  // 8 second loop
createMusicLoop(path.join(musicDir, 'gameplay_loop.wav'), 16);  // 16 second loop

console.log('\nDone! Audio files generated.');
console.log('Note: These are synthesized placeholders. For production, replace with Kenney.nl CC0 sounds.');
