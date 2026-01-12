/**
 * Create ZIP file of the dist folder for distribution
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const distDir = path.join(__dirname, '..', 'dist');
const zipPath = path.join(__dirname, '..', 'dist', 'fountain-spell-assist.zip');

// Check if dist exists
if (!fs.existsSync(distDir)) {
  console.error('Error: dist folder not found. Run "npm run build:extension" first.');
  process.exit(1);
}

// Remove old zip if exists
if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

try {
  // Use native zip command (works on macOS/Linux)
  // For Windows, use PowerShell Compress-Archive
  const isWindows = process.platform === 'win32';
  
  if (isWindows) {
    // Use PowerShell Compress-Archive on Windows
    const distPath = path.resolve(distDir);
    const zipName = path.basename(zipPath);
    
    // Create zip excluding source maps
    const psCommand = `$files = Get-ChildItem -Path "${distPath}" -File | Where-Object { $_.Extension -ne '.map' }; $files | Compress-Archive -DestinationPath "${zipPath}" -Force`;
    execSync(`powershell -Command "${psCommand}"`, { stdio: 'inherit' });
  } else {
    // Use zip command on Unix-like systems
    process.chdir(distDir);
    execSync(`zip -r "${zipPath}" . -x "*.map" "*.map.*"`, { stdio: 'inherit' });
  }
  
  const stats = fs.statSync(zipPath);
  console.log(`✓ Created ${zipPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
} catch (error) {
  console.error('Error creating zip file:', error.message);
  console.log('\nNote: You may need to manually create the zip file from the dist folder.');
  process.exit(1);
}

