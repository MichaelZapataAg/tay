const fs = require('fs');
const path = require('path');

// Let's inspect the compiled entry bundle for any potential crashes
const distDir = path.join(__dirname, '..', 'dist', '_expo', 'static', 'js', 'web');
const files = fs.readdirSync(distDir);
console.log('Dist JS files:', files);

// Let's check if the entry bundle has baseUrl /tay properly configured
const entryFile = files.find(f => f.startsWith('entry-'));
if (entryFile) {
  const content = fs.readFileSync(path.join(distDir, entryFile), 'utf8');
  console.log('Entry file size:', content.length);
  // Check if router basePath / baseUrl is in bundle
  console.log('Has /tay basePath?', content.includes('/tay'));
}
