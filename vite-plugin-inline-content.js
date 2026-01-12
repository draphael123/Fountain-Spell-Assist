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
      
      if (!contentEntry) return;
      
      // Find all chunks that content.js depends on (including vendor chunks)
      const chunksToInline = new Set();
      const visited = new Set();
      
      function collectDependencies(fileName) {
        if (visited.has(fileName)) return;
        visited.add(fileName);
        
        const chunk = Object.values(bundle).find(
          (c) => c.type === 'chunk' && (c.fileName === fileName || c.name === fileName)
        );
        
        if (chunk) {
          chunksToInline.add(chunk.fileName);
          
          // Collect imports
          if (chunk.imports) {
            chunk.imports.forEach((imp) => {
              collectDependencies(imp);
            });
          }
          
          // Also check dynamic imports in code
          const dynamicImports = chunk.code.match(/import\(['"](.*?)['"]\)/g);
          if (dynamicImports) {
            dynamicImports.forEach((imp) => {
              const path = imp.match(/['"](.*?)['"]/)?.[1];
              if (path) {
                const resolvedChunk = Object.values(bundle).find(
                  (c) => c.type === 'chunk' && (c.fileName.includes(path) || c.name?.includes(path))
                );
                if (resolvedChunk) {
                  collectDependencies(resolvedChunk.fileName);
                }
              }
            });
          }
        }
      }
      
      collectDependencies(contentEntry.fileName);
      
      // Merge all chunks into content.js
      let mergedCode = contentEntry.code;
      const importsToRemove = new Set();
      
      chunksToInline.forEach((fileName) => {
        if (fileName === contentEntry.fileName) return;
        
        const chunk = Object.values(bundle).find(
          (c) => c.type === 'chunk' && c.fileName === fileName
        );
        
        if (chunk) {
          // Remove import statements from content.js that reference this chunk
          const importRegex = new RegExp(`import\\s+.*?from\\s+['"]\\.?/?${fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"];?\\s*`, 'gm');
          mergedCode = mergedCode.replace(importRegex, '');
          importsToRemove.add(fileName);
          
          // Inline the chunk code (remove its imports too)
          let chunkCode = chunk.code;
          if (chunk.imports) {
            chunk.imports.forEach((imp) => {
              const impRegex = new RegExp(`import\\s+.*?from\\s+['"]\\.?/?${imp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"];?\\s*`, 'gm');
              chunkCode = chunkCode.replace(impRegex, '');
            });
          }
          
          mergedCode += '\n' + chunkCode;
          
          // Delete the chunk
          delete bundle[fileName];
        }
      });
      
      // Remove all import statements from content.js
      mergedCode = mergedCode.replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '');
      
      // Update content.js with merged code
      contentEntry.code = mergedCode;
      contentEntry.imports = [];
      contentEntry.dynamicImports = [];
    },
  };
}

