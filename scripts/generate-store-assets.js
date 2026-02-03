const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const inputDir = 'C:/Users/maito/Downloads';
const outputDir = 'C:/Users/maito/summitwheelsgame/store-assets';

async function generateAssets() {
  console.log('Generating store assets...\n');

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 1. Google Play Icon (512x512) - already correct, just copy
  console.log('1. Google Play Icon (512x512)');
  await sharp(path.join(inputDir, 'Summitwheel_appIcon.PNG'))
    .resize(512, 512)
    .png()
    .toFile(path.join(outputDir, 'google-play-icon-512x512.png'));
  console.log('   ✓ google-play-icon-512x512.png\n');

  // 2. Apple App Store Icon (1024x1024)
  console.log('2. Apple App Store Icon (1024x1024)');
  await sharp(path.join(inputDir, 'F8880889-ADCC-4DD1-8B56-66489267569B.PNG'))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(outputDir, 'apple-app-store-icon-1024x1024.png'));
  console.log('   ✓ apple-app-store-icon-1024x1024.png\n');

  // 3. Google Play Feature Graphic (1024x500)
  console.log('3. Google Play Feature Graphic (1024x500)');
  await sharp(path.join(inputDir, 'IMG_5196.PNG'))
    .resize(1024, 500, { fit: 'cover', position: 'center' })
    .png()
    .toFile(path.join(outputDir, 'google-play-feature-graphic-1024x500.png'));
  console.log('   ✓ google-play-feature-graphic-1024x500.png\n');

  // 4. Phone Screenshots for Google Play (1080x1920 - standard phone)
  console.log('4. Google Play Screenshots (1080x1920)');
  const screenshotFiles = [
    '43A53E17-82B4-4037-B400-FC56BF006752.PNG',
    '166E4B25-516A-48C3-8098-7F693272F060.PNG',
    'C1D115D5-2F62-4BBE-8E62-EBAE9913FBE4.PNG'
  ];

  for (let i = 0; i < screenshotFiles.length; i++) {
    await sharp(path.join(inputDir, screenshotFiles[i]))
      .resize(1080, 1920, { fit: 'cover', position: 'center' })
      .png()
      .toFile(path.join(outputDir, `google-play-screenshot-${i + 1}-1080x1920.png`));
    console.log(`   ✓ google-play-screenshot-${i + 1}-1080x1920.png`);
  }
  console.log('');

  // 5. iPhone 6.5" Screenshots (1284x2778)
  console.log('5. Apple App Store Screenshots - iPhone 6.5" (1284x2778)');
  for (let i = 0; i < screenshotFiles.length; i++) {
    await sharp(path.join(inputDir, screenshotFiles[i]))
      .resize(1284, 2778, { fit: 'cover', position: 'center' })
      .png()
      .toFile(path.join(outputDir, `apple-iphone65-screenshot-${i + 1}-1284x2778.png`));
    console.log(`   ✓ apple-iphone65-screenshot-${i + 1}-1284x2778.png`);
  }
  console.log('');

  // 6. iPhone 5.5" Screenshots (1242x2208)
  console.log('6. Apple App Store Screenshots - iPhone 5.5" (1242x2208)');
  for (let i = 0; i < screenshotFiles.length; i++) {
    await sharp(path.join(inputDir, screenshotFiles[i]))
      .resize(1242, 2208, { fit: 'cover', position: 'center' })
      .png()
      .toFile(path.join(outputDir, `apple-iphone55-screenshot-${i + 1}-1242x2208.png`));
    console.log(`   ✓ apple-iphone55-screenshot-${i + 1}-1242x2208.png`);
  }
  console.log('');

  // 7. Android Adaptive Icon (foreground layer 432x432)
  console.log('7. Android Adaptive Icon Foreground (432x432)');
  await sharp(path.join(inputDir, 'Summitwheel_appIcon.PNG'))
    .resize(432, 432)
    .png()
    .toFile(path.join(outputDir, 'android-adaptive-foreground-432x432.png'));
  console.log('   ✓ android-adaptive-foreground-432x432.png\n');

  console.log('========================================');
  console.log('All store assets generated successfully!');
  console.log(`Output directory: ${outputDir}`);
  console.log('========================================\n');

  // List all generated files
  const files = fs.readdirSync(outputDir);
  console.log('Generated files:');
  files.forEach(f => {
    const stats = fs.statSync(path.join(outputDir, f));
    console.log(`  - ${f} (${(stats.size / 1024).toFixed(1)} KB)`);
  });
}

generateAssets().catch(console.error);
