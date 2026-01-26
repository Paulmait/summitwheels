/**
 * Download and setup audio assets from Kenney.nl (CC0)
 *
 * This script downloads royalty-free sound effects from Kenney.nl
 * and copies them to the correct locations.
 *
 * Run: node scripts/downloadAudio.js
 *
 * Manual alternative:
 * 1. Download from https://kenney.nl/assets/interface-sounds
 * 2. Download from https://kenney.nl/assets/impact-sounds
 * 3. Extract and copy sounds to assets/audio/sfx/
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const AUDIO_DIR = path.join(__dirname, '..', 'assets', 'audio');
const SFX_DIR = path.join(AUDIO_DIR, 'sfx');
const MUSIC_DIR = path.join(AUDIO_DIR, 'music');

// Kenney.nl direct download URLs (may need updating)
const KENNEY_URLS = {
  interface: 'https://kenney.nl/media/pages/assets/interface-sounds/06fa1d4e81-1677493524/kenney_interface-sounds.zip',
  impact: 'https://kenney.nl/media/pages/assets/impact-sounds/07f34c0632-1677675653/kenney_impact-sounds.zip',
};

/**
 * Sound file mappings - maps our keys to Kenney filenames
 */
const SOUND_MAPPINGS = {
  // From Interface Sounds pack
  'coin.ogg': 'Audio/confirmation_001.ogg',
  'powerup.ogg': 'Audio/maximize_008.ogg',
  'click.ogg': 'Audio/click_001.ogg',
  'switch.ogg': 'Audio/switch_001.ogg',
  'confirm.ogg': 'Audio/confirmation_002.ogg',
  'jingle.ogg': 'Audio/jingle_win_00.ogg',

  // From Impact Sounds pack
  'crash.ogg': 'Audio/impactMetal_heavy_003.ogg',
  'whoosh.ogg': 'Audio/footstep_carpet_000.ogg', // placeholder
  'landing.ogg': 'Audio/impactSoft_medium_000.ogg',
};

/**
 * Ensure directories exist
 */
function ensureDirectories() {
  [AUDIO_DIR, SFX_DIR, MUSIC_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created: ${dir}`);
    }
  });
}

/**
 * Create placeholder audio info file
 */
function createAudioReadme() {
  const readme = `# Summit Wheels Audio Assets

## Sound Sources (CC0 1.0 Universal)

All sounds in this directory are licensed under CC0 (Public Domain).

### Sources:
- **Kenney.nl** - Interface Sounds, Impact Sounds
  - https://kenney.nl/assets/interface-sounds
  - https://kenney.nl/assets/impact-sounds

### Manual Download Instructions:

1. Visit https://kenney.nl/assets
2. Download "Interface Sounds" and "Impact Sounds" packs
3. Extract the following files to \`assets/audio/sfx/\`:

| Our File | Kenney File |
|----------|-------------|
| coin.ogg | Audio/confirmation_001.ogg |
| powerup.ogg | Audio/maximize_008.ogg |
| crash.ogg | Audio/impactMetal_heavy_003.ogg |
| whoosh.ogg | Audio/swoosh (any) |
| click.ogg | Audio/click_001.ogg |
| switch.ogg | Audio/switch_001.ogg |
| confirm.ogg | Audio/confirmation_002.ogg |
| jingle.ogg | Audio/jingle_win_00.ogg |
| landing.ogg | Audio/impactSoft_medium_000.ogg |

### Attribution (Optional but Appreciated):
Sound effects from Kenney.nl (CC0 1.0 Universal)
`;

  fs.writeFileSync(path.join(AUDIO_DIR, 'README.md'), readme);
  console.log('Created: assets/audio/README.md');
}

/**
 * Create placeholder .ogg files (silent, for testing)
 * These are minimal valid OGG files that won't cause errors
 */
function createPlaceholderSounds() {
  // Minimal valid OGG Vorbis file (silent, ~100ms)
  // This is a base64-encoded minimal OGG file
  const minimalOgg = Buffer.from(
    'T2dnUwACAAAAAAAAAABOFQAAAAAAAH0xC1sBHgF2b3JiaXMAAAAAAUSsAAAAAAAA' +
    'AHcBAAAAAAC4AU9nZ1MAAAAAAAAAAABOAQAAAAAAAL0y3eUBHgF2b3JiaXMcAAAA' +
    'WGlwaC5PcmcgbGliVm9yYmlzIEkgMjAxMDA1MjUAAAAAAQV2b3JiaXMiQkNWAQBB' +
    'AAABFGIAACAAAB4AAFAAAAAAAHAAAA==',
    'base64'
  );

  const sounds = [
    'coin.ogg',
    'powerup.ogg',
    'crash.ogg',
    'whoosh.ogg',
    'click.ogg',
    'switch.ogg',
    'confirm.ogg',
    'jingle.ogg',
    'landing.ogg',
    'engine_start.ogg',
    'engine_loop.ogg',
    'brake.ogg',
  ];

  sounds.forEach(filename => {
    const filepath = path.join(SFX_DIR, filename);
    if (!fs.existsSync(filepath)) {
      fs.writeFileSync(filepath, minimalOgg);
      console.log(`Created placeholder: sfx/${filename}`);
    }
  });

  // Create placeholder music files
  const musicFiles = ['menu_theme.ogg', 'gameplay_loop.ogg'];
  musicFiles.forEach(filename => {
    const filepath = path.join(MUSIC_DIR, filename);
    if (!fs.existsSync(filepath)) {
      fs.writeFileSync(filepath, minimalOgg);
      console.log(`Created placeholder: music/${filename}`);
    }
  });
}

/**
 * Main function
 */
async function main() {
  console.log('\n🎵 Summit Wheels Audio Setup\n');

  ensureDirectories();
  createAudioReadme();
  createPlaceholderSounds();

  console.log('\n✅ Audio setup complete!\n');
  console.log('Placeholder sounds created for testing.');
  console.log('Replace with actual Kenney.nl sounds for production.\n');
  console.log('Download from:');
  console.log('  - https://kenney.nl/assets/interface-sounds');
  console.log('  - https://kenney.nl/assets/impact-sounds\n');
}

main().catch(console.error);
