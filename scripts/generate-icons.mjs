// Generates simple PWA PNG icons (192, 512, maskable 512) with a solid brand
// background and a white location-pin shape. Uses only Node built-ins (zlib).
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public', 'icons');
mkdirSync(outDir, { recursive: true });

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function makePng(size, { maskable = false } = {}) {
  const W = size;
  const H = size;
  const bg = [14, 165, 233]; // brand-500
  const white = [255, 255, 255];

  // For maskable, keep safe area: only draw the pin in the central 60%.
  const cx = W / 2;
  const cy = H / 2;
  const pinRadius = W * (maskable ? 0.22 : 0.28);
  const pinTop = cy - W * (maskable ? 0.18 : 0.22);
  const pinBottom = cy + W * (maskable ? 0.26 : 0.32);
  const innerDotR = pinRadius * 0.34;

  // RGBA scanlines with filter byte 0 per row.
  const rowLen = W * 4;
  const raw = Buffer.alloc((rowLen + 1) * H);
  for (let y = 0; y < H; y++) {
    raw[y * (rowLen + 1)] = 0; // filter none
    for (let x = 0; x < W; x++) {
      const o = y * (rowLen + 1) + 1 + x * 4;
      // Default background
      let r = bg[0], g = bg[1], b = bg[2], a = 255;

      // Pin shape: circle at top + triangle to bottom
      const dx = x - cx;
      const dyCircle = y - (pinTop + pinRadius);
      const inCircle = dx * dx + dyCircle * dyCircle <= pinRadius * pinRadius;
      // Triangle from circle bottom to pinBottom
      const triTop = pinTop + pinRadius * 0.6;
      const triHeight = pinBottom - triTop;
      let inTri = false;
      if (y >= triTop && y <= pinBottom && triHeight > 0) {
        const t = (y - triTop) / triHeight;
        const halfW = pinRadius * (1 - t);
        if (Math.abs(dx) <= halfW) inTri = true;
      }
      if (inCircle || inTri) {
        r = white[0]; g = white[1]; b = white[2];
        // Inner dot (brand color)
        const dyDot = y - (pinTop + pinRadius);
        if (dx * dx + dyDot * dyDot <= innerDotR * innerDotR) {
          r = bg[0]; g = bg[1]; b = bg[2];
        }
      }

      raw[o] = r;
      raw[o + 1] = g;
      raw[o + 2] = b;
      raw[o + 3] = a;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = deflateSync(raw);
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

writeFileSync(join(outDir, 'icon-192.png'), makePng(192));
writeFileSync(join(outDir, 'icon-512.png'), makePng(512));
writeFileSync(join(outDir, 'icon-maskable-512.png'), makePng(512, { maskable: true }));
console.log('Icons generated in', outDir);
