/**
 * Icon Generation Script
 * 
 * Creates simple colored PNG icons for the Chrome extension.
 * Run with: node scripts/generate-icons.cjs
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ICON_SIZES = [16, 32, 48, 128];
const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons');

// Create CRC32 lookup table
const CRC_TABLE = (function() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(data) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ data[i]) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createPngChunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  
  const crcData = Buffer.concat([typeBuffer, data]);
  const crcValue = crc32(crcData);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crcValue);
  
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function createSimplePng(size) {
  const width = size;
  const height = size;
  
  // PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR chunk data
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8);  // bit depth
  ihdrData.writeUInt8(2, 9);  // color type (RGB)
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace
  
  const ihdr = createPngChunk('IHDR', ihdrData);
  
  // Create raw image data (RGB)
  const rawData = Buffer.alloc(height * (1 + width * 3));
  let offset = 0;
  
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // filter type (none)
    for (let x = 0; x < width; x++) {
      // Orange color: #f97316
      rawData[offset++] = 249; // R
      rawData[offset++] = 115; // G
      rawData[offset++] = 22;  // B
    }
  }
  
  // Compress with zlib
  const compressed = zlib.deflateSync(rawData);
  const idat = createPngChunk('IDAT', compressed);
  
  // IEND chunk
  const iend = createPngChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdr, idat, iend]);
}

// Ensure icons directory exists
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// Generate icons
console.log('Generating PNG icons...');

for (const size of ICON_SIZES) {
  try {
    const pngData = createSimplePng(size);
    const outputPath = path.join(ICONS_DIR, `icon${size}.png`);
    fs.writeFileSync(outputPath, pngData);
    console.log(`  Created icon${size}.png`);
  } catch (error) {
    console.error(`  Failed to create icon${size}.png:`, error.message);
  }
}

console.log('');
console.log('Done! Icons generated.');
console.log('Note: These are simple orange placeholder icons.');
console.log('For custom icons, replace the PNGs in public/icons/');
