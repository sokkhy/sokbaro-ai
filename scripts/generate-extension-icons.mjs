import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { deflateSync } from "node:zlib";

const root = resolve(import.meta.dirname, "..");
const outDir = resolve(root, "public/icons");
const sizes = [16, 32, 48, 128];
const sampleRate = 4;

const colors = {
  background: [5, 46, 43, 255],
  posture: [16, 185, 129, 255],
  light: [236, 253, 245, 255],
  dark: [5, 46, 43, 255],
  transparent: [0, 0, 0, 0],
};

mkdirSync(outDir, { recursive: true });

for (const size of sizes) {
  const png = createPng(size, size, renderIcon(size));
  writeFileSync(resolve(outDir, `icon-${size}.png`), png);
}

console.log(`Generated extension icons in ${outDir}`);

function renderIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const acc = [0, 0, 0, 0];

      for (let sy = 0; sy < sampleRate; sy += 1) {
        for (let sx = 0; sx < sampleRate; sx += 1) {
          const nx = ((x + (sx + 0.5) / sampleRate) / size) * 128;
          const ny = ((y + (sy + 0.5) / sampleRate) / size) * 128;
          composite(acc, sample(nx, ny));
        }
      }

      const i = (y * size + x) * 4;
      const samples = sampleRate * sampleRate;
      pixels[i] = Math.round(acc[0] / samples);
      pixels[i + 1] = Math.round(acc[1] / samples);
      pixels[i + 2] = Math.round(acc[2] / samples);
      pixels[i + 3] = Math.round(acc[3] / samples);
    }
  }

  return pixels;
}

function sample(x, y) {
  let color = colors.transparent;

  if (roundedRectContains(x, y, 0, 0, 128, 128, 28)) {
    color = colors.background;
  }

  if (distance(x, y, 64, 64) <= 48) {
    color = colors.posture;
  }

  if (polylineDistance(x, y, [[39, 82], [48, 91], [56, 96], [64, 97], [72, 96], [80, 91], [89, 82]]) <= 5) {
    color = colors.dark;
  }

  if (lineDistance(x, y, 64, 31, 64, 81) <= 6) {
    color = colors.light;
  }

  if (polylineDistance(x, y, [[43, 48], [51, 40], [59, 36], [64, 36], [69, 36], [77, 40], [85, 48]]) <= 6) {
    color = colors.light;
  }

  if (distance(x, y, 64, 26) <= 10) {
    color = colors.light;
  }

  return color;
}

function composite(acc, color) {
  acc[0] += color[0];
  acc[1] += color[1];
  acc[2] += color[2];
  acc[3] += color[3];
}

function roundedRectContains(x, y, left, top, width, height, radius) {
  const cx = clamp(x, left + radius, left + width - radius);
  const cy = clamp(y, top + radius, top + height - radius);
  return distance(x, y, cx, cy) <= radius;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distance(x1, y1, x2, y2) {
  return Math.hypot(x1 - x2, y1 - y2);
}

function lineDistance(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared === 0 ? 0 : clamp(((px - x1) * dx + (py - y1) * dy) / lengthSquared, 0, 1);
  return distance(px, py, x1 + t * dx, y1 + t * dy);
}

function polylineDistance(x, y, points) {
  let min = Number.POSITIVE_INFINITY;
  for (let i = 1; i < points.length; i += 1) {
    min = Math.min(min, lineDistance(x, y, points[i - 1][0], points[i - 1][1], points[i][0], points[i][1]));
  }
  return min;
}

function createPng(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const scanlines = Buffer.alloc((width * 4 + 1) * height);

  for (let y = 0; y < height; y += 1) {
    const scanlineOffset = y * (width * 4 + 1);
    scanlines[scanlineOffset] = 0;
    rgba.copy(scanlines, scanlineOffset + 1, y * width * 4, (y + 1) * width * 4);
  }

  return Buffer.concat([
    signature,
    chunk("IHDR", Buffer.concat([
      uint32(width),
      uint32(height),
      Buffer.from([8, 6, 0, 0, 0]),
    ])),
    chunk("IDAT", deflateSync(scanlines)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const crcInput = Buffer.concat([typeBuffer, data]);
  return Buffer.concat([
    uint32(data.length),
    typeBuffer,
    data,
    uint32(crc32(crcInput)),
  ]);
}

function uint32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(value >>> 0);
  return buffer;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
