#!/usr/bin/env node
/**
 * Generador de íconos para Tay Préstamos a partir de iconTay.png
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SOURCE = '/Users/maik/Downloads/iconTay.png';
const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const IOS_ICON_PATH = path.join(
  __dirname,
  '..',
  'ios',
  'TayPrstamos',
  'Images.xcassets',
  'AppIcon.appiconset',
  'App-Icon-1024x1024@1x.png'
);

if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

async function processIcons() {
  if (!fs.existsSync(SOURCE)) {
    console.error('Source icon not found:', SOURCE);
    return;
  }

  console.log('Processing icon from:', SOURCE);

  // 1. App Icon principal (1024x1024)
  await sharp(SOURCE)
    .resize(1024, 1024, { fit: 'cover' })
    .png()
    .toFile(path.join(ASSETS_DIR, 'icon.png'));
  console.log('✓ assets/icon.png (1024x1024)');

  // 2. iOS AppIcon Catalog (1024x1024)
  if (fs.existsSync(path.dirname(IOS_ICON_PATH))) {
    await sharp(SOURCE)
      .resize(1024, 1024, { fit: 'cover' })
      .png()
      .toFile(IOS_ICON_PATH);
    console.log('✓ iOS AppIcon Catalog (1024x1024)');
  }

  // 3. Favicon (196x196)
  await sharp(SOURCE)
    .resize(196, 196, { fit: 'cover' })
    .png()
    .toFile(path.join(ASSETS_DIR, 'favicon.png'));
  console.log('✓ assets/favicon.png (196x196)');

  // 4. Splash Icon (512x512)
  await sharp(SOURCE)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(ASSETS_DIR, 'splash-icon.png'));
  console.log('✓ assets/splash-icon.png (512x512)');

  // 5. Android Foreground (1024x1024)
  await sharp(SOURCE)
    .resize(1024, 1024, { fit: 'cover' })
    .png()
    .toFile(path.join(ASSETS_DIR, 'android-icon-foreground.png'));
  console.log('✓ assets/android-icon-foreground.png');

  // 6. Android Monochrome (1024x1024)
  await sharp(SOURCE)
    .resize(1024, 1024, { fit: 'cover' })
    .grayscale()
    .png()
    .toFile(path.join(ASSETS_DIR, 'android-icon-monochrome.png'));
  console.log('✓ assets/android-icon-monochrome.png');

  console.log('All icons generated successfully!');
}

processIcons().catch(console.error);
