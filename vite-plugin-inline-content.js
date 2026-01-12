/**
 * Vite plugin to inline all dynamic imports for content script
 * This ensures content.js is a single file without import statements
 */

export default function inlineContentScript() {
  return {
    name: 'inline-content-script',
    generateBundle(options, bundle) {
      // Find content.js entry
      const contentEntry = Object.values(bundle).find(
        (chunk) => chunk.type === 'chunk' && chunk.isEntry && chunk.name === 'content'
      );
      
      if (!contentEntry) {
        console.warn('FSA Plugin: content.js entry not found');
        return;
      }
      
      console.log('FSA Plugin: Found content.js entry, processing...');
      
      // Find all chunks that content.js depends on
      const chunksToInline = new Set();
      const visited = new Set();
      
      function collectDependencies(fileName) {
        if (visited.has(fileName)) return;
        visited.add(fileName);
        
        // Find chunk by fileName or by matching name
        const chunk = Object.values(bundle).find(
          (c) => c.type === 'chunk' && (c.fileName === fileName || c.name === fileName || fileName.includes(c.fileName) || c.fileName.includes(fileName))
        );
        
        if (chunk && chunk.fileName !== contentEntry.fileName) {
          chunksToInline.add(chunk.fileName);
          console.log(`FSA Plugin: Will inline ${chunk.fileName}`);
          
          // Collect all its imports recursively
          if (chunk.imports && chunk.imports.length > 0) {
            chunk.imports.forEach((imp) => {
              collectDependencies(imp);
            });
          }
        }
      }
      
      // Start collecting from content.js imports
      if (contentEntry.imports && contentEntry.imports.length > 0) {
        contentEntry.imports.forEach((imp) => {
          collectDependencies(imp);
        });
      }
      
      // Also check for ANY chunks in assets folder that content.js might import
      Object.values(bundle).forEach((chunk) => {
        if (chunk.type === 'chunk' && chunk.fileName.startsWith('assets/')) {
          // Check if content.js code references this chunk
          if (contentEntry.code.includes(chunk.fileName) || 
              contentEntry.code.includes(chunk.name || '')) {
            chunksToInline.add(chunk.fileName);
            console.log(`FSA Plugin: Will inline referenced chunk ${chunk.fileName}`);
          }
        }
      });
      
      // Also find chunks by checking import statements in content.js code
      const importMatches = contentEntry.code.matchAll(/from\s+['"](\.\/assets\/[^'"]+)['"]/g);
      for (const match of importMatches) {
        const importPath = match[1];
        const chunk = Object.values(bundle).find(
          (c) => c.type === 'chunk' && c.fileName.includes(importPath.replace('./assets/', '').split('.')[0])
        );
        if (chunk) {
          chunksToInline.add(chunk.fileName);
          console.log(`FSA Plugin: Found import ${importPath}, will inline ${chunk.fileName}`);
        }
      }
      
      // Merge all chunks into content.js
      let mergedCode = contentEntry.code;
      
      // First, remove all import statements from content.js
      mergedCode = mergedCode.replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '');
      mergedCode = mergedCode.replace(/import\s+.*?from\s+['"].*?['"];?\s*/g, '');
      
      // Now inline all dependent chunks
      chunksToInline.forEach((fileName) => {
        const chunk = Object.values(bundle).find(
          (c) => c.type === 'chunk' && c.fileName === fileName
        );
        
        if (chunk) {
          let chunkCode = chunk.code;
          
          // Remove import statements from chunk code
          chunkCode = chunkCode.replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '');
          chunkCode = chunkCode.replace(/import\s+.*?from\s+['"].*?['"];?\s*/g, '');
          
          // Remove export statements and make them available
          chunkCode = chunkCode.replace(/^export\s+/gm, '');
          
          mergedCode = '\n' + chunkCode + '\n' + mergedCode;
          
          // Delete the chunk
          delete bundle[fileName];
          console.log(`FSA Plugin: Inlined and removed ${fileName}`);
        }
      });
      
      // Final cleanup - remove any remaining import/export statements
      mergedCode = mergedCode.replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '');
      mergedCode = mergedCode.replace(/^export\s+.*?from\s+['"].*?['"];?\s*$/gm, '');
      
      // Update content.js
      contentEntry.code = mergedCode;
      contentEntry.imports = [];
      contentEntry.dynamicImports = [];
      
      console.log('FSA Plugin: Content script inlined successfully');
    },
  };
}

