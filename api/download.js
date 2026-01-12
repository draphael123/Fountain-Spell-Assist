/**
 * Vercel Serverless Function - Download Handler
 * Serves the extension zip file for download
 */

const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  const { file } = req.query;
  
  if (file === 'fountain-spell-assist.zip') {
    // Path to the built extension in dist folder
    const zipPath = path.join(process.cwd(), 'dist', 'fountain-spell-assist.zip');
    
    // Check if file exists
    if (!fs.existsSync(zipPath)) {
      res.status(404).json({ error: 'File not found' });
      return;
    }
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="fountain-spell-assist.zip"');
    res.setHeader('Content-Length', fs.statSync(zipPath).size);
    
    // Stream the file
    const fileStream = fs.createReadStream(zipPath);
    fileStream.pipe(res);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
};

