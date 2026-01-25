/**
 * Summit Wheels - App Store Asset Generator
 *
 * Generates branded icons and splash screens matching the official style:
 * - Bright sky blue gradients
 * - Red monster truck
 * - Sandy/tan terrain
 * - "SUMMIT WHEELS" logo with wheel in the O
 *
 * Run with: node scripts/generateAssets.js
 */

const { createCanvas, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

// Official Summit Wheels brand colors
const COLORS = {
  // Sky gradient
  skyTop: '#1E90FF',      // Dodger blue
  skyMiddle: '#4AA8FF',   // Light sky blue
  skyBottom: '#87CEEB',   // Sky blue

  // Terrain
  terrainLight: '#E8C87A', // Light sand
  terrainMid: '#D4A55A',   // Sandy tan
  terrainDark: '#B8864A',  // Dark sand/brown
  terrainShadow: '#8B6914', // Shadow

  // Grass
  grassLight: '#90C44A',
  grassDark: '#6B9B30',

  // Truck (red monster truck)
  truckBody: '#E53935',    // Red
  truckBodyDark: '#B71C1C', // Dark red
  truckWindow: '#1565C0',  // Blue window
  truckTire: '#2D2D2D',    // Dark tire
  truckRim: '#9E9E9E',     // Gray rim

  // UI elements
  gold: '#FFD700',
  goldDark: '#DAA520',
  white: '#FFFFFF',
  black: '#000000',

  // Logo
  logoText: '#FFFFFF',
  logoOutline: '#1A1A1A',
  logoShadow: '#333333',
};

/**
 * Draw sky gradient
 */
function drawSky(ctx, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height * 0.7);
  gradient.addColorStop(0, COLORS.skyTop);
  gradient.addColorStop(0.5, COLORS.skyMiddle);
  gradient.addColorStop(1, COLORS.skyBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Draw fluffy clouds
 */
function drawCloud(ctx, x, y, scale) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.beginPath();
  ctx.arc(x, y, 20 * scale, 0, Math.PI * 2);
  ctx.arc(x + 25 * scale, y - 10 * scale, 25 * scale, 0, Math.PI * 2);
  ctx.arc(x + 50 * scale, y, 20 * scale, 0, Math.PI * 2);
  ctx.arc(x + 25 * scale, y + 5 * scale, 18 * scale, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draw hilly terrain
 */
function drawTerrain(ctx, width, height, hillHeight) {
  const baseY = height * 0.55;

  // Main hill gradient
  const terrainGradient = ctx.createLinearGradient(0, baseY - hillHeight, 0, height);
  terrainGradient.addColorStop(0, COLORS.terrainLight);
  terrainGradient.addColorStop(0.4, COLORS.terrainMid);
  terrainGradient.addColorStop(0.8, COLORS.terrainDark);
  terrainGradient.addColorStop(1, COLORS.terrainShadow);

  ctx.fillStyle = terrainGradient;
  ctx.beginPath();
  ctx.moveTo(0, height);

  // Rolling hills
  ctx.lineTo(0, baseY + 20);
  ctx.quadraticCurveTo(width * 0.15, baseY - hillHeight * 0.3, width * 0.25, baseY);
  ctx.quadraticCurveTo(width * 0.4, baseY - hillHeight * 0.8, width * 0.55, baseY - hillHeight * 0.2);
  ctx.quadraticCurveTo(width * 0.7, baseY + hillHeight * 0.1, width * 0.85, baseY - hillHeight * 0.4);
  ctx.quadraticCurveTo(width * 0.95, baseY - hillHeight * 0.6, width, baseY);
  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fill();

  // Grass tufts on top
  ctx.fillStyle = COLORS.grassLight;
  for (let x = 0; x < width; x += width * 0.08) {
    const hillY = getHillY(x, width, baseY, hillHeight);
    drawGrassTuft(ctx, x, hillY, width * 0.015);
  }
}

function getHillY(x, width, baseY, hillHeight) {
  // Approximate hill curve
  const progress = x / width;
  if (progress < 0.25) {
    return baseY + 20 - (progress / 0.25) * hillHeight * 0.3;
  } else if (progress < 0.55) {
    return baseY - hillHeight * 0.3 + ((progress - 0.25) / 0.3) * hillHeight * 0.5;
  } else if (progress < 0.85) {
    return baseY - hillHeight * 0.2 - ((progress - 0.55) / 0.3) * hillHeight * 0.2;
  }
  return baseY - hillHeight * 0.4;
}

function drawGrassTuft(ctx, x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.quadraticCurveTo(x - size * 0.5, y - size * 2, x, y - size * 0.5);
  ctx.quadraticCurveTo(x + size * 0.5, y - size * 2, x + size, y);
  ctx.fill();
}

/**
 * Draw a stylized monster truck
 */
function drawMonsterTruck(ctx, x, y, scale, rotation = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);

  const wheelRadius = 28;
  const bodyWidth = 80;
  const bodyHeight = 35;

  // Rear wheel
  drawWheel(ctx, -bodyWidth * 0.35, wheelRadius * 0.8, wheelRadius);

  // Front wheel
  drawWheel(ctx, bodyWidth * 0.35, wheelRadius * 0.8, wheelRadius);

  // Truck body shadow
  ctx.fillStyle = COLORS.truckBodyDark;
  ctx.beginPath();
  roundRect(ctx, -bodyWidth / 2 + 2, -bodyHeight - wheelRadius * 0.3 + 2, bodyWidth, bodyHeight, 8);
  ctx.fill();

  // Truck body
  ctx.fillStyle = COLORS.truckBody;
  ctx.beginPath();
  roundRect(ctx, -bodyWidth / 2, -bodyHeight - wheelRadius * 0.3, bodyWidth, bodyHeight, 8);
  ctx.fill();

  // Cabin/window area
  ctx.fillStyle = COLORS.truckWindow;
  ctx.beginPath();
  roundRect(ctx, -bodyWidth * 0.15, -bodyHeight - wheelRadius * 0.3 + 5, bodyWidth * 0.35, bodyHeight * 0.6, 4);
  ctx.fill();

  // Windshield highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.beginPath();
  ctx.moveTo(-bodyWidth * 0.1, -bodyHeight - wheelRadius * 0.3 + 8);
  ctx.lineTo(bodyWidth * 0.05, -bodyHeight - wheelRadius * 0.3 + 8);
  ctx.lineTo(-bodyWidth * 0.05, -bodyHeight - wheelRadius * 0.3 + 18);
  ctx.lineTo(-bodyWidth * 0.1, -bodyHeight - wheelRadius * 0.3 + 18);
  ctx.fill();

  // Front bumper
  ctx.fillStyle = COLORS.truckBodyDark;
  ctx.fillRect(bodyWidth * 0.25, -wheelRadius * 0.5, 15, 12);

  // Headlight
  ctx.fillStyle = '#FFEB3B';
  ctx.beginPath();
  ctx.arc(bodyWidth * 0.38, -wheelRadius * 0.4, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawWheel(ctx, x, y, radius) {
  // Tire
  ctx.fillStyle = COLORS.truckTire;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Tire tread pattern
  ctx.strokeStyle = '#1A1A1A';
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * radius * 0.7, y + Math.sin(angle) * radius * 0.7);
    ctx.lineTo(x + Math.cos(angle) * radius * 0.95, y + Math.sin(angle) * radius * 0.95);
    ctx.stroke();
  }

  // Rim
  ctx.fillStyle = COLORS.truckRim;
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.5, 0, Math.PI * 2);
  ctx.fill();

  // Hub
  ctx.fillStyle = '#666';
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Hub bolts
  ctx.fillStyle = '#888';
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.arc(
      x + Math.cos(angle) * radius * 0.35,
      y + Math.sin(angle) * radius * 0.35,
      radius * 0.06,
      0, Math.PI * 2
    );
    ctx.fill();
  }
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
}

/**
 * Draw a gold coin
 */
function drawCoin(ctx, x, y, radius) {
  // Outer ring
  ctx.fillStyle = COLORS.goldDark;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Inner gold
  ctx.fillStyle = COLORS.gold;
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.85, 0, Math.PI * 2);
  ctx.fill();

  // Shine
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.beginPath();
  ctx.arc(x - radius * 0.2, y - radius * 0.2, radius * 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Dollar sign or star
  ctx.fillStyle = COLORS.goldDark;
  ctx.font = `bold ${radius}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$', x, y + 1);
}

/**
 * Draw the Summit Wheels logo
 * The "O" in WHEELS is replaced with a wheel/tire
 */
function drawLogo(ctx, x, y, fontSize, darkMode = false) {
  const textColor = darkMode ? COLORS.white : COLORS.white;
  const outlineColor = COLORS.logoOutline;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Draw "SUMMIT" on top line
  ctx.font = `bold ${fontSize}px Arial Black, Arial, sans-serif`;

  // Shadow
  ctx.fillStyle = COLORS.logoShadow;
  ctx.fillText('SUMMIT', x + 3, y - fontSize * 0.5 + 3);

  // Outline
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = fontSize * 0.08;
  ctx.strokeText('SUMMIT', x, y - fontSize * 0.5);

  // Fill
  ctx.fillStyle = textColor;
  ctx.fillText('SUMMIT', x, y - fontSize * 0.5);

  // Draw "WH" + wheel + "ELS" on bottom line
  const wheelsY = y + fontSize * 0.55;

  // Measure parts
  ctx.font = `bold ${fontSize}px Arial Black, Arial, sans-serif`;
  const whWidth = ctx.measureText('WH').width;
  const elsWidth = ctx.measureText('ELS').width;
  const wheelSize = fontSize * 0.75;
  const totalWidth = whWidth + wheelSize + elsWidth;

  const startX = x - totalWidth / 2;

  // Shadow for WHEELS text
  ctx.fillStyle = COLORS.logoShadow;
  ctx.textAlign = 'left';
  ctx.fillText('WH', startX + 3, wheelsY + 3);
  ctx.fillText('ELS', startX + whWidth + wheelSize + 3, wheelsY + 3);

  // Outline
  ctx.strokeStyle = outlineColor;
  ctx.strokeText('WH', startX, wheelsY);
  ctx.strokeText('ELS', startX + whWidth + wheelSize, wheelsY);

  // Fill
  ctx.fillStyle = textColor;
  ctx.fillText('WH', startX, wheelsY);
  ctx.fillText('ELS', startX + whWidth + wheelSize, wheelsY);

  // Draw wheel in place of "O"
  const wheelX = startX + whWidth + wheelSize / 2;
  const wheelY = wheelsY;
  const wheelRadius = wheelSize / 2;

  // Wheel shadow
  ctx.fillStyle = COLORS.logoShadow;
  ctx.beginPath();
  ctx.arc(wheelX + 3, wheelY + 3, wheelRadius, 0, Math.PI * 2);
  ctx.fill();

  // Tire
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.arc(wheelX, wheelY, wheelRadius, 0, Math.PI * 2);
  ctx.fill();

  // Rim
  ctx.fillStyle = '#888';
  ctx.beginPath();
  ctx.arc(wheelX, wheelY, wheelRadius * 0.65, 0, Math.PI * 2);
  ctx.fill();

  // Hub
  ctx.fillStyle = '#666';
  ctx.beginPath();
  ctx.arc(wheelX, wheelY, wheelRadius * 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Spokes
  ctx.strokeStyle = '#555';
  ctx.lineWidth = wheelRadius * 0.1;
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(wheelX, wheelY);
    ctx.lineTo(
      wheelX + Math.cos(angle) * wheelRadius * 0.55,
      wheelY + Math.sin(angle) * wheelRadius * 0.55
    );
    ctx.stroke();
  }
}

/**
 * Draw the app icon (red truck jumping over hill with coin)
 */
function drawAppIcon(ctx, size) {
  // Sky
  drawSky(ctx, size, size);

  // Clouds
  drawCloud(ctx, size * 0.15, size * 0.15, size / 400);
  drawCloud(ctx, size * 0.7, size * 0.1, size / 500);

  // Terrain (big hill in center)
  const baseY = size * 0.65;
  const hillPeak = size * 0.35;

  // Hill gradient
  const terrainGradient = ctx.createLinearGradient(0, hillPeak, 0, size);
  terrainGradient.addColorStop(0, COLORS.terrainLight);
  terrainGradient.addColorStop(0.5, COLORS.terrainMid);
  terrainGradient.addColorStop(1, COLORS.terrainDark);

  ctx.fillStyle = terrainGradient;
  ctx.beginPath();
  ctx.moveTo(0, size);
  ctx.lineTo(0, size * 0.8);
  ctx.quadraticCurveTo(size * 0.3, size * 0.45, size * 0.5, size * 0.55);
  ctx.quadraticCurveTo(size * 0.7, size * 0.65, size, size * 0.75);
  ctx.lineTo(size, size);
  ctx.closePath();
  ctx.fill();

  // Grass on hill
  ctx.fillStyle = COLORS.grassLight;
  for (let i = 0; i < 12; i++) {
    const gx = size * (0.1 + i * 0.07);
    const gy = size * 0.8 - (Math.sin(i * 0.8) * size * 0.15);
    drawGrassTuft(ctx, gx, gy, size * 0.012);
  }

  // Monster truck (jumping pose - tilted upward)
  drawMonsterTruck(ctx, size * 0.45, size * 0.38, size / 280, -0.3);

  // Gold coin in upper right
  drawCoin(ctx, size * 0.82, size * 0.18, size * 0.08);
}

/**
 * Draw splash screen
 */
function drawSplashScreen(ctx, width, height) {
  // Sky
  drawSky(ctx, width, height);

  // Clouds
  const cloudScale = Math.min(width, height) / 600;
  drawCloud(ctx, width * 0.1, height * 0.08, cloudScale);
  drawCloud(ctx, width * 0.5, height * 0.05, cloudScale * 0.8);
  drawCloud(ctx, width * 0.85, height * 0.1, cloudScale * 0.9);

  // Distant mountains
  ctx.fillStyle = 'rgba(100, 130, 160, 0.4)';
  ctx.beginPath();
  ctx.moveTo(0, height * 0.5);
  ctx.lineTo(width * 0.2, height * 0.35);
  ctx.lineTo(width * 0.35, height * 0.42);
  ctx.lineTo(width * 0.5, height * 0.3);
  ctx.lineTo(width * 0.65, height * 0.38);
  ctx.lineTo(width * 0.8, height * 0.32);
  ctx.lineTo(width, height * 0.4);
  ctx.lineTo(width, height * 0.5);
  ctx.closePath();
  ctx.fill();

  // Main terrain
  drawTerrain(ctx, width, height, height * 0.2);

  // Logo in center
  const logoSize = Math.min(width, height) * 0.12;
  drawLogo(ctx, width / 2, height * 0.42, logoSize);

  // Tagline
  ctx.font = `${logoSize * 0.25}px Arial, sans-serif`;
  ctx.fillStyle = COLORS.white;
  ctx.textAlign = 'center';
  ctx.globalAlpha = 0.9;
  ctx.fillText('Hill Climb Racing Challenge', width / 2, height * 0.55);
  ctx.globalAlpha = 1;

  // Small truck silhouette at bottom
  drawMonsterTruck(ctx, width * 0.5, height * 0.78, Math.min(width, height) / 400, -0.1);
}

/**
 * Draw adaptive icon foreground (Android)
 */
function drawAdaptiveIcon(ctx, size) {
  // Transparent background with just the truck and coin
  ctx.clearRect(0, 0, size, size);

  // Safe zone consideration - center content
  const center = size / 2;

  // Small terrain hint
  const terrainGradient = ctx.createLinearGradient(0, size * 0.6, 0, size);
  terrainGradient.addColorStop(0, COLORS.terrainLight);
  terrainGradient.addColorStop(1, COLORS.terrainMid);

  ctx.fillStyle = terrainGradient;
  ctx.beginPath();
  ctx.moveTo(size * 0.1, size);
  ctx.quadraticCurveTo(size * 0.3, size * 0.65, center, size * 0.7);
  ctx.quadraticCurveTo(size * 0.7, size * 0.75, size * 0.9, size);
  ctx.closePath();
  ctx.fill();

  // Monster truck
  drawMonsterTruck(ctx, center, size * 0.52, size / 320, -0.2);

  // Coin
  drawCoin(ctx, size * 0.75, size * 0.28, size * 0.07);
}

/**
 * Save canvas to file
 */
function saveCanvas(canvas, filename) {
  const buffer = canvas.toBuffer('image/png');
  const filepath = path.join(__dirname, '..', 'assets', filename);
  fs.writeFileSync(filepath, buffer);
  console.log(`  ✓ ${filename}`);
}

/**
 * Main generation function
 */
function generateAssets() {
  console.log('\n🎮 Summit Wheels - App Store Asset Generator\n');
  console.log('Brand: Bright sky blue, red monster truck, sandy terrain\n');

  // Ensure assets directory exists
  const assetsDir = path.join(__dirname, '..', 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  // 1. App Icon (1024x1024) - Required for App Store
  console.log('📱 Creating app icons...');
  const icon1024 = createCanvas(1024, 1024);
  drawAppIcon(icon1024.getContext('2d'), 1024);
  saveCanvas(icon1024, 'icon.png');

  // 2. Smaller icon for in-app use
  const icon512 = createCanvas(512, 512);
  drawAppIcon(icon512.getContext('2d'), 512);
  saveCanvas(icon512, 'icon-512.png');

  // 3. Favicon (48x48)
  const favicon = createCanvas(48, 48);
  drawAppIcon(favicon.getContext('2d'), 48);
  saveCanvas(favicon, 'favicon.png');

  // 4. Adaptive icon for Android (1024x1024 foreground)
  console.log('\n🤖 Creating Android adaptive icon...');
  const adaptive = createCanvas(1024, 1024);
  drawAdaptiveIcon(adaptive.getContext('2d'), 1024);
  saveCanvas(adaptive, 'adaptive-icon.png');

  // 5. Splash screens
  console.log('\n🖼️  Creating splash screens...');

  // iPhone splash (1284x2778 - iPhone 14 Pro Max)
  const splashIphone = createCanvas(1284, 2778);
  drawSplashScreen(splashIphone.getContext('2d'), 1284, 2778);
  saveCanvas(splashIphone, 'splash.png');

  // Splash icon for Expo (200x200)
  const splashIcon = createCanvas(200, 200);
  drawAppIcon(splashIcon.getContext('2d'), 200);
  saveCanvas(splashIcon, 'splash-icon.png');

  console.log('\n✅ All assets generated successfully!\n');
  console.log('Generated files in /assets:');
  console.log('  • icon.png (1024x1024) - App Store icon');
  console.log('  • icon-512.png (512x512) - In-app icon');
  console.log('  • favicon.png (48x48) - Web favicon');
  console.log('  • adaptive-icon.png (1024x1024) - Android adaptive');
  console.log('  • splash.png (1284x2778) - iPhone splash');
  console.log('  • splash-icon.png (200x200) - Expo splash icon');
  console.log('\n💡 Run "npm run generate:assets" to regenerate\n');
}

// Run
generateAssets();
