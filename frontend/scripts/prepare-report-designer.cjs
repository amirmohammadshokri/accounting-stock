// Serve the official SDK through the same public-assets pipeline as the designer page.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'node_modules', 'stimulsoft-reports-js');
const target = path.join(root, 'public', 'vendor', 'stimulsoft', '2024.3.2');
const files = [
  ...['reports', 'viewer', 'designer'].map(name => [`Scripts/stimulsoft.${name}.pack.js`, `stimulsoft.${name}.pack.js`]),
  ['LICENSE.md', 'LICENSE.md'],
  ['THIRD-PARTY.md', 'THIRD-PARTY.md']
];
for (const [input] of files) {
  if (!fs.existsSync(path.join(source, input))) {
    throw new Error('Stimulsoft SDK is missing. Run npm ci in the frontend folder.');
  }
}
fs.mkdirSync(target, { recursive: true });
for (const [input, output] of files) {
  fs.copyFileSync(path.join(source, input), path.join(target, output));
}
console.log('Prepared local Stimulsoft Reports.JS 2024.3.2 assets.');
