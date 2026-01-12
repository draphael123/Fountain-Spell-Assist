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
      mergedCode = mergedCode.replace(/import\s+.*?from\s+['"].*?['"];?\s*/g, '');
      mergedCode = mergedCode.replace(/^export\s+.*?from\s+['"].*?['"];?\s*$/gm, '');
      
      // Remove all export statements (comprehensive cleanup)
      // Remove export { ... } blocks (multiline, handles nested braces)
      mergedCode = mergedCode.replace(/export\s*\{[^}]*\};?\s*/gs, '');
      // Remove export default statements
      mergedCode = mergedCode.replace(/export\s+default\s+.*?;?\s*/g, '');
      // Remove export const/function/class/let/var declarations
      mergedCode = mergedCode.replace(/^export\s+(const|function|class|let|var)\s+/gm, '$1 ');
      // Remove any remaining export keywords
      mergedCode = mergedCode.replace(/^export\s+/gm, '');
      
      // Remove module preload polyfill (not needed for content scripts)
      // The polyfill starts with "(function polyfill()" and ends with "})();"
      const polyfillStart = mergedCode.indexOf('(function polyfill()');
      if (polyfillStart !== -1) {
        const polyfillEnd = mergedCode.indexOf('})();', polyfillStart);
        if (polyfillEnd !== -1) {
          // Remove the polyfill and any leading whitespace/newlines
          const beforePolyfill = mergedCode.substring(0, polyfillStart).replace(/\n\s*$/, '');
          const afterPolyfill = mergedCode.substring(polyfillEnd + 6).replace(/^\s*\n/, '');
          mergedCode = beforePolyfill + (beforePolyfill && afterPolyfill ? '\n' : '') + afterPolyfill;
          console.log('FSA Plugin: Removed module preload polyfill');
        }
      }
      
      // Update content.js
      contentEntry.code = mergedCode;
      contentEntry.imports = [];
      contentEntry.dynamicImports = [];
      
      console.log('FSA Plugin: Content script inlined successfully - all exports removed');
    },
  };
}

