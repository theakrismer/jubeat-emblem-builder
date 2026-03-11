/**
 * generate-manifest.js
 *
 * Run this script from the project root to scan the src/layer1–layer5
 * folders and generate a manifest.json file listing all PNG images.
 *
 * Usage:
 *   node generate-manifest.js
 */

const fs = require('fs');
const path = require('path');

const NUM_LAYERS = 5;
const SRC_DIR = path.join(__dirname, 'src');
const OUTPUT_FILE = path.join(__dirname, 'manifest.json');

const manifest = {};

for (let i = 1; i <= NUM_LAYERS; i++) {
  const key = `layer${i}`;
  const dir = path.join(SRC_DIR, key);

  if (!fs.existsSync(dir)) {
    console.warn(`  [warn] Directory not found: ${dir}`);
    manifest[key] = [];
    continue;
  }

  const files = fs
    .readdirSync(dir)
    .filter(f => /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  manifest[key] = files;
  console.log(`  ${key}: ${files.length} file(s) found`);
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2));
console.log(`\n✅ manifest.json written to ${OUTPUT_FILE}`);
