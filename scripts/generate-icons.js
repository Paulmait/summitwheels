/**
 * Generate all app icon sizes from the source icon
 * Uses sharp for high-quality image resizing
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SOURCE_ICON = path.join(__dirname, '..', 'assets', 'icon-new.png');
const ASSETS_DIR = path.join(__dirname, '..', 'assets');

// Icon sizes needed for various platforms
const ICONS = [
  { name: 'icon.png', size: 1024 },
  { name: 'icon-512.png', size: 512 },
  { name: 'adaptive-icon.png', size: 1024 },
  { name: 'favicon.png', size: 48 },
  { name: 'splash-icon.png', size: 200 },
];

// iOS icon sizes
const IOS_ICONS = [
  { name: 'icon-20.png', size: 20 },
  { name: 'icon-20@2x.png', size: 40 },
  { name: 'icon-20@3x.png', size: 60 },
  { name: 'icon-29.png', size: 29 },
  { name: 'icon-29@2x.png', size: 58 },
  { name: 'icon-29@3x.png', size: 87 },
  { name: 'icon-40.png', size: 40 },
  { name: 'icon-40@2x.png', size: 80 },
  { name: 'icon-40@3x.png', size: 120 },
  { name: 'icon-60@2x.png', size: 120 },
  { name: 'icon-60@3x.png', size: 180 },
  { name: 'icon-76.png', size: 76 },
  { name: 'icon-76@2x.png', size: 152 },
  { name: 'icon-83.5@2x.png', size: 167 },
  { name: 'icon-1024.png', size: 1024 },
];

// Android icon sizes (for mipmap folders)
const ANDROID_ICONS = [
  { name: 'mipmap-mdpi/ic_launcher.png', size: 48 },
  { name: 'mipmap-hdpi/ic_launcher.png', size: 72 },
  { name: 'mipmap-xhdpi/ic_launcher.png', size: 96 },
  { name: 'mipmap-xxhdpi/ic_launcher.png', size: 144 },
  { name: 'mipmap-xxxhdpi/ic_launcher.png', size: 192 },
  { name: 'mipmap-mdpi/ic_launcher_round.png', size: 48 },
  { name: 'mipmap-hdpi/ic_launcher_round.png', size: 72 },
  { name: 'mipmap-xhdpi/ic_launcher_round.png', size: 96 },
  { name: 'mipmap-xxhdpi/ic_launcher_round.png', size: 144 },
  { name: 'mipmap-xxxhdpi/ic_launcher_round.png', size: 192 },
];

async function generateIcon(source, outputPath, size, isRound = false) {
  let pipeline = sharp(source).resize(size, size, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 }
  });

  if (isRound) {
    // Create circular mask for round icons
    const roundedCorners = Buffer.from(
      `<svg><circle cx="${size/2}" cy="${size/2}" r="${size/2}"/></svg>`
    );

    pipeline = pipeline.composite([{
      input: roundedCorners,
      blend: 'dest-in'
    }]);
  }

  await pipeline.png().toFile(outputPath);
  console.log(`  ✓ ${path.basename(outputPath)} (${size}x${size})`);
}

async function main() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  SUMMIT WHEELS - APP ICON GENERATOR');
  console.log('═══════════════════════════════════════════════════════\n');

  if (!fs.existsSync(SOURCE_ICON)) {
    console.error('❌ Source icon not found:', SOURCE_ICON);
    process.exit(1);
  }

  const metadata = await sharp(SOURCE_ICON).metadata();
  console.log(`📷 Source: ${path.basename(SOURCE_ICON)}`);
  console.log(`   Size: ${metadata.width}x${metadata.height}`);
  console.log(`   Format: ${metadata.format}\n`);

  // Generate main Expo/React Native icons
  console.log('📱 Generating Expo assets...');
  for (const icon of ICONS) {
    const outputPath = path.join(ASSETS_DIR, icon.name);
    await generateIcon(SOURCE_ICON, outputPath, icon.size);
  }

  // Create iOS icons directory
  const iosDir = path.join(ASSETS_DIR, 'ios');
  if (!fs.existsSync(iosDir)) {
    fs.mkdirSync(iosDir, { recursive: true });
  }

  console.log('\n🍎 Generating iOS icons...');
  for (const icon of IOS_ICONS) {
    const outputPath = path.join(iosDir, icon.name);
    await generateIcon(SOURCE_ICON, outputPath, icon.size);
  }

  // Create Android icons directories
  const androidDir = path.join(ASSETS_DIR, 'android');
  const mipmapDirs = ['mipmap-mdpi', 'mipmap-hdpi', 'mipmap-xhdpi', 'mipmap-xxhdpi', 'mipmap-xxxhdpi'];

  for (const dir of mipmapDirs) {
    const fullPath = path.join(androidDir, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  }

  console.log('\n🤖 Generating Android icons...');
  for (const icon of ANDROID_ICONS) {
    const outputPath = path.join(androidDir, icon.name);
    const isRound = icon.name.includes('_round');
    await generateIcon(SOURCE_ICON, outputPath, icon.size, isRound);
  }

  // Generate splash screen with icon
  console.log('\n🖼️ Generating splash screen...');
  const splashSize = 2048;
  const iconOnSplash = 600;

  // Create splash with gradient background and centered icon
  const splash = await sharp({
    create: {
      width: splashSize,
      height: splashSize,
      channels: 4,
      background: { r: 79, g: 70, b: 229, alpha: 1 } // Purple gradient base
    }
  })
  .composite([{
    input: await sharp(SOURCE_ICON)
      .resize(iconOnSplash, iconOnSplash)
      .toBuffer(),
    gravity: 'center'
  }])
  .png()
  .toFile(path.join(ASSETS_DIR, 'splash.png'));

  console.log(`  ✓ splash.png (${splashSize}x${splashSize})`);

  // Copy to store-assets for App Store/Play Store
  const storeDir = path.join(__dirname, '..', 'store-assets');
  if (!fs.existsSync(storeDir)) {
    fs.mkdirSync(storeDir, { recursive: true });
  }

  console.log('\n🏪 Generating store assets...');

  // App Store icon (1024x1024, no transparency, no rounded corners)
  await sharp(SOURCE_ICON)
    .resize(1024, 1024)
    .flatten({ background: { r: 135, g: 206, b: 235 } }) // Sky blue background
    .png()
    .toFile(path.join(storeDir, 'app-store-icon.png'));
  console.log('  ✓ app-store-icon.png (1024x1024)');

  // Play Store icon (512x512)
  await sharp(SOURCE_ICON)
    .resize(512, 512)
    .png()
    .toFile(path.join(storeDir, 'play-store-icon.png'));
  console.log('  ✓ play-store-icon.png (512x512)');

  // Feature graphic for Play Store (1024x500)
  await sharp({
    create: {
      width: 1024,
      height: 500,
      channels: 4,
      background: { r: 135, g: 206, b: 235, alpha: 1 }
    }
  })
  .composite([{
    input: await sharp(SOURCE_ICON)
      .resize(400, 400)
      .toBuffer(),
    left: 50,
    top: 50
  }])
  .png()
  .toFile(path.join(storeDir, 'feature-graphic.png'));
  console.log('  ✓ feature-graphic.png (1024x500)');

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  ✅ ALL ICONS GENERATED SUCCESSFULLY!');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('Generated assets:');
  console.log('  • assets/ - Main Expo icons');
  console.log('  • assets/ios/ - iOS app icons');
  console.log('  • assets/android/ - Android mipmap icons');
  console.log('  • store-assets/ - App Store & Play Store icons\n');
}

main().catch(console.error);
