#!/usr/bin/env node
/**
 * Generador de íconos para Tay Préstamos preservando transparencia
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

const PASTEL_LILA_BG = { r: 245, g: 243, b: 255, alpha: 1 }; // #F5F3FF

async function processIcons() {
  if (!fs.existsSync(SOURCE)) {
    console.error('Source icon not found:', SOURCE);
    return;
  }

  console.log('Generating transparent icons from:', SOURCE);

  // 1. Favicon: 100% TRANSPARENTE
  await sharp(SOURCE)
    .resize(196, 196, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(ASSETS_DIR, 'favicon.png'));
  console.log('✓ assets/favicon.png (100% transparente)');

  // 2. Splash icon: 100% TRANSPARENTE
  await sharp(SOURCE)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(ASSETS_DIR, 'splash-icon.png'));
  console.log('✓ assets/splash-icon.png (100% transparente)');

  // 3. Android foreground: 100% TRANSPARENTE
  await sharp(SOURCE)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: 256,
      bottom: 256,
      left: 256,
      right: 256,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .resize(1024, 1024)
    .png()
    .toFile(path.join(ASSETS_DIR, 'android-icon-foreground.png'));
  console.log('✓ assets/android-icon-foreground.png (100% transparente)');

  // 4. Android background: Fondo pastel suave
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: PASTEL_LILA_BG,
    },
  })
    .png()
    .toFile(path.join(ASSETS_DIR, 'android-icon-background.png'));
  console.log('✓ assets/android-icon-background.png (Lila pastel #F5F3FF)');

  // 5. iOS / App Icon (Apple exige fondo sin canal alfa para la App Store y home screen)
  // Componemos el ícono transparente sobre el fondo lila pastel suave (#F5F3FF) con aire
  const resizedInner = await sharp(SOURCE)
    .resize(860, 860, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const iosAppIcon = await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: PASTEL_LILA_BG,
    },
  })
    .composite([{ input: resizedInner, gravity: 'center' }])
    .png();

  await iosAppIcon.toFile(path.join(ASSETS_DIR, 'icon.png'));
  console.log('✓ assets/icon.png (Ícono sobre fondo lila pastel #F5F3FF)');

  if (fs.existsSync(path.dirname(IOS_ICON_PATH))) {
    await iosAppIcon.toFile(IOS_ICON_PATH);
    console.log('✓ iOS AppIcon Catalog');
  }

  console.log('All icons generated successfully!');
}

processIcons().catch(console.error);
