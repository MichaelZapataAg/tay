#!/usr/bin/env node
/**
 * Generador de íconos para Tay Préstamos ✨
 * Paleta lila lavanda pastel, celeste y chispitas doradas.
 * Corre con: node scripts/generate-icons.js
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const OUT = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(OUT)) {
  fs.mkdirSync(OUT, { recursive: true });
}

const LILA_DARK = '#7C3AED';
const LILA = '#8B5CF6';
const LILA_BG = '#F5F3FF';
const PINK = '#F472B6';
const GOLD = '#F59E0B';

function tayIconSvg(size, scale, { bg = null, mono = false } = {}) {
  const s = size * scale;
  const cx = size / 2;
  const cy = size / 2;
  const top = (size - s) / 2;

  const bgRect = bg ? `<rect width="${size}" height="${size}" fill="${bg}" rx="${size * 0.24}"/>` : '';

  // Tarjeta / cartera financiera con bordes súper redondeados
  const cardW = s * 0.76;
  const cardH = s * 0.82;
  const cardX = cx - cardW / 2;
  const cardY = cy - cardH / 2;
  const cardColor = mono ? 'white' : LILA;
  const cardInner = mono ? LILA : LILA_DARK;
  const symbolColor = mono ? LILA : 'white';
  const accentColor = mono ? 'white' : GOLD;
  const sparkleColor = mono ? 'white' : PINK;

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  ${bgRect}
  <!-- Card base -->
  <rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}" rx="${s * 0.20}" fill="${cardColor}"/>
  <!-- Inner subtle gradient card layer -->
  <rect x="${cardX + s * 0.04}" y="${cardY + s * 0.04}" width="${cardW - s * 0.08}" height="${cardH - s * 0.08}" rx="${s * 0.16}" fill="${cardInner}" opacity="0.25"/>
  
  <!-- Símbolo de moneda / Peso / Dólar central estilizado -->
  <circle cx="${cx}" cy="${cy}" r="${s * 0.22}" fill="${cardColor}" stroke="${accentColor}" stroke-width="${s * 0.035}"/>
  
  <!-- Signo $ -->
  <text x="${cx}" y="${cy + s * 0.085}" font-family="system-ui, -apple-system, sans-serif" font-size="${s * 0.28}" font-weight="900" text-anchor="middle" fill="${symbolColor}">$</text>

  <!-- Chispitas / Destello arriba a la derecha -->
  <path d="M ${cx + s * 0.25} ${top + s * 0.16} Q ${cx + s * 0.28} ${top + s * 0.20} ${cx + s * 0.32} ${top + s * 0.20} Q ${cx + s * 0.28} ${top + s * 0.20} ${cx + s * 0.25} ${top + s * 0.24} Q ${cx + s * 0.22} ${top + s * 0.20} ${cx + s * 0.18} ${top + s * 0.20} Q ${cx + s * 0.22} ${top + s * 0.20} ${cx + s * 0.25} ${top + s * 0.16} Z" fill="${sparkleColor}"/>
</svg>`;
}

async function render(svg, file, size) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(path.join(OUT, file));
  console.log('✓', file);
}

function solidSvg(size, color) {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><rect width="${size}" height="${size}" fill="${color}"/></svg>`;
}

(async () => {
  // Ícono principal (iOS + fallback)
  await render(tayIconSvg(1024, 0.72, { bg: LILA_BG }), 'icon.png', 1024);
  // Android adaptive
  await render(tayIconSvg(1024, 0.5), 'android-icon-foreground.png', 1024);
  await render(solidSvg(1024, LILA_BG), 'android-icon-background.png', 1024);
  await render(tayIconSvg(1024, 0.5, { mono: true }), 'android-icon-monochrome.png', 1024);
  // Splash
  await render(tayIconSvg(1024, 0.65), 'splash-icon.png', 1024);
  await render(tayIconSvg(196, 0.8, { bg: LILA_BG }), 'favicon.png', 196);
})();
