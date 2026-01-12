/**
 * Copy zip file from dist to public folder for Vercel deployment
 */

const fs = require('fs');
const path = require('path');

const distZip = path.join(__dirname, '..', 'dist', 'fountain-spell-assist.zip');
const publicZip = path.join(__dirname, '..', 'public', 'fountain-spell-assist.zip');

if (!fs.existsSync(distZip)) {
  console.error('Error: fountain-spell-assist.zip not found in dist folder. Run "npm run zip" first.');
  process.exit(1);
}

try {
  fs.copyFileSync(distZip, publicZip);
  const stats = fs.statSync(publicZip);
  console.log(`✓ Copied zip to public folder (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
} catch (error) {
  console.error('Error copying zip file:', error.message);
  process.exit(1);
}

