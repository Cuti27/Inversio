// Genera los iconos PNG de la PWA a partir de public/favicon.svg usando sharp.
// Uso: npm run icons
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'public');
const svg = readFileSync(join(publicDir, 'favicon.svg'), 'utf8');

/**
 * Crea una variante "a sangre" (sin esquinas redondeadas ni margen interior):
 * fondo de gradiente a cuadrado completo + el contenido del icono encima.
 * Necesaria para iconos maskable y apple-touch-icon, donde el SO aplica su
 * propia máscara y no debe haber transparencia en las esquinas.
 */
function fullBleedSvg(source) {
  // Quita el <rect> de fondo original (el que lleva rx y stroke).
  const withoutBackground = source.replace(
    /<rect\s+x="1"[\s\S]*?stroke-width="2"\s*\/>/,
    ''
  );
  const defs = withoutBackground.match(/<defs>[\s\S]*?<\/defs>/)?.[0] ?? '';
  const inner = withoutBackground
    .replace(/<defs>[\s\S]*?<\/defs>/, '')
    .replace(/<\/?svg[^>]*>/g, '')
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<desc>[\s\S]*?<\/desc>/, '')
    .trim();

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" fill="none">
  ${defs}
  <rect x="0" y="0" width="512" height="512" fill="url(#backgroundGradient)"/>
  ${inner}
</svg>`;
}

const targets = [
  { name: 'pwa-192x192.png', size: 192, source: svg },
  { name: 'pwa-512x512.png', size: 512, source: svg },
  { name: 'maskable-icon-512x512.png', size: 512, source: fullBleedSvg(svg) },
  { name: 'apple-touch-icon.png', size: 180, source: fullBleedSvg(svg) },
];

for (const { name, size, source } of targets) {
  const png = await sharp(Buffer.from(source))
    .resize(size, size, { fit: 'cover' })
    .png()
    .toBuffer();
  writeFileSync(join(publicDir, name), png);
  console.log(`generated ${name} (${size}x${size})`);
}
