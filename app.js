/**
 * Jubeat Emblem Builder - app.js
 *
 * Scans src/layer1 through src/layer5 for PNG files via a manifest file
 * (manifest.json) or falls back to a directory-listing approach.
 *
 * Because browsers cannot list directory contents directly, the app reads
 * a manifest.json file at the root that lists available images per layer.
 * If no manifest exists (e.g. during development with a local server that
 * supports directory listing), it will try to auto-detect files.
 *
 * To generate manifest.json automatically, run:
 *   node generate-manifest.js
 * from the project root.
 */

const NUM_LAYERS = 5;

// State: selected filename per layer (null = none selected)
const state = {
  layer1: null,
  layer2: null,
  layer3: null,
  layer4: null,
  layer5: null,
};

// Cache of files per layer
const layerFiles = {
  layer1: [],
  layer2: [],
  layer3: [],
  layer4: [],
  layer5: [],
};

// ─── Initialise ─────────────────────────────────────────────────────────────

async function init() {
  await loadManifest();
  renderLayerPanels();
  renderPreviewSelections();
  bindActions();
}

// ─── Manifest Loading ────────────────────────────────────────────────────────

async function loadManifest() {
  try {
    const res = await fetch('manifest.json');
    if (!res.ok) throw new Error('No manifest.json found');
    const manifest = await res.json();
    for (let i = 1; i <= NUM_LAYERS; i++) {
      const key = `layer${i}`;
      layerFiles[key] = (manifest[key] || []).map(f => `src/${key}/${f}`);
    }
  } catch (err) {
    console.warn('manifest.json not found or invalid. Layers will be empty until you generate a manifest.', err);
    // Leave layerFiles empty — tiles won't show but UI still works
  }
}

// ─── Render Layer Panels ─────────────────────────────────────────────────────

function renderLayerPanels() {
  const container = document.getElementById('layersPanel');
  container.innerHTML = '';

  for (let i = 1; i <= NUM_LAYERS; i++) {
    const key = `layer${i}`;
    const files = layerFiles[key];

    const section = document.createElement('div');
    section.className = 'layer-section collapsed';
    section.id = `section-${key}`;

    // Header
    const header = document.createElement('div');
    header.className = 'layer-header';
    header.innerHTML = `
      <div class="header-left">
        <span class="layer-number">Layer ${i}</span>
        <span class="layer-title">Layer ${i}</span>
        <span class="layer-count">${files.length} option${files.length !== 1 ? 's' : ''}</span>
      </div>
      <span class="collapse-icon">▼</span>
    `;
    header.addEventListener('click', () => toggleSection(section));

    // Body
    const body = document.createElement('div');
    body.className = 'layer-body';

    const grid = document.createElement('div');
    grid.className = 'layer-grid';
    grid.id = `grid-${key}`;

    if (files.length === 0) {
      const msg = document.createElement('p');
      msg.className = 'loading-msg';
      msg.textContent = 'No images found. Add PNGs to src/' + key + '/ and run generate-manifest.js.';
      grid.appendChild(msg);
    } else {
      // "None" tile first
      grid.appendChild(createNoneTile(key));

      files.forEach(filePath => {
        grid.appendChild(createOptionTile(key, filePath));
      });
    }

    body.appendChild(grid);
    section.appendChild(header);
    section.appendChild(body);
    container.appendChild(section);
  }
}

// ─── Tile Builders ───────────────────────────────────────────────────────────

function createNoneTile(layerKey) {
  const tile = document.createElement('div');
  tile.className = 'option-tile none-tile';
  tile.dataset.layer = layerKey;
  tile.dataset.file = '';
  tile.title = 'None (clear this layer)';

  tile.innerHTML = `
    <div class="none-x">✕</div>
    <span class="tile-label">None</span>
    <span class="check-icon">✓</span>
  `;

  // Select none on load by default (null == none tile is selected)
  if (state[layerKey] === null) {
    tile.classList.add('selected');
  }

  tile.addEventListener('click', () => selectOption(layerKey, null, tile));
  return tile;
}

function createOptionTile(layerKey, filePath) {
  const tile = document.createElement('div');
  tile.className = 'option-tile';
  tile.dataset.layer = layerKey;
  tile.dataset.file = filePath;

  const fileName = filePath.split('/').pop();
  tile.title = fileName;

  tile.innerHTML = `
    <img src="${filePath}" alt="${fileName}" loading="lazy" />
    <span class="tile-label">${fileName}</span>
    <span class="check-icon">✓</span>
  `;

  if (state[layerKey] === filePath) {
    tile.classList.add('selected');
  }

  tile.addEventListener('click', () => selectOption(layerKey, filePath, tile));
  return tile;
}

// ─── Selection Logic ─────────────────────────────────────────────────────────

function selectOption(layerKey, filePath, clickedTile) {
  state[layerKey] = filePath;

  // Update tile highlights in this layer's grid
  const grid = document.getElementById(`grid-${layerKey}`);
  grid.querySelectorAll('.option-tile').forEach(t => t.classList.remove('selected'));
  clickedTile.classList.add('selected');

  // Update section border
  const section = document.getElementById(`section-${layerKey}`);
  section.classList.toggle('has-selection', filePath !== null);

  // Update preview image
  const img = document.getElementById(`preview-${layerKey}`);
  if (filePath) {
    img.src = filePath;
    img.classList.add('visible');
  } else {
    img.src = '';
    img.classList.remove('visible');
  }

  renderPreviewSelections();
}

// ─── Active Selections Display ───────────────────────────────────────────────

function renderPreviewSelections() {
  const container = document.getElementById('activeSelections');
  container.innerHTML = '';

  for (let i = 1; i <= NUM_LAYERS; i++) {
    const key = `layer${i}`;
    const row = document.createElement('div');
    row.className = 'selection-row';

    const label = document.createElement('span');
    label.className = 'layer-label';
    label.textContent = `Layer ${i}`;

    const value = document.createElement('span');
    if (state[key]) {
      value.className = 'file-name';
      value.textContent = state[key].split('/').pop();
      value.title = state[key];
    } else {
      value.className = 'none-label';
      value.textContent = '— none —';
    }

    row.appendChild(label);
    row.appendChild(value);
    container.appendChild(row);
  }
}

// ─── Collapse / Expand ───────────────────────────────────────────────────────

function toggleSection(section) {
  section.classList.toggle('collapsed');
}

// ─── Export / Import ─────────────────────────────────────────────────────────

function exportJSON() {
  const data = {};
  for (let i = 1; i <= NUM_LAYERS; i++) {
    const key = `layer${i}`;
    // Store just the filename, not the full path, for portability
    data[key] = state[key] ? state[key].split('/').pop() : null;
  }
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'emblem-config.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importJSON(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      applyConfig(data);
    } catch (err) {
      alert('Invalid JSON file: ' + err.message);
    }
  };
  reader.readAsText(file);
}

function applyConfig(data) {
  for (let i = 1; i <= NUM_LAYERS; i++) {
    const key = `layer${i}`;
    const fileName = data[key] || null;

    // Resolve to full path
    let filePath = null;
    if (fileName) {
      // Try to match against known files (handles both full paths and bare filenames)
      const match = layerFiles[key].find(f => f === fileName || f.split('/').pop() === fileName);
      filePath = match || `src/${key}/${fileName}`;
    }

    state[key] = filePath;

    // Update preview image
    const img = document.getElementById(`preview-${key}`);
    if (filePath) {
      img.src = filePath;
      img.classList.add('visible');
    } else {
      img.src = '';
      img.classList.remove('visible');
    }

    // Update tile highlights
    const grid = document.getElementById(`grid-${key}`);
    if (grid) {
      grid.querySelectorAll('.option-tile').forEach(tile => {
        const tileFile = tile.dataset.file;
        const match = filePath
          ? (tileFile === filePath || tileFile.split('/').pop() === filePath.split('/').pop())
          : (tileFile === '');
        tile.classList.toggle('selected', match);
      });
    }

    // Update section border
    const section = document.getElementById(`section-${key}`);
    if (section) {
      section.classList.toggle('has-selection', filePath !== null);
    }
  }

  renderPreviewSelections();
}

// ─── Save as PNG ─────────────────────────────────────────────────────────────

async function saveAsPNG() {
  const SIZE = 455;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');

  // Draw each visible layer in order onto the canvas
  for (let i = 1; i <= NUM_LAYERS; i++) {
    const key = `layer${i}`;
    if (!state[key]) continue;

    await new Promise((resolve, reject) => {
      const img = new Image();
      // crossOrigin needed when served from a different origin (e.g. GitHub Pages)
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, 0, 0, SIZE, SIZE);
        resolve();
      };
      img.onerror = () => {
        console.warn(`Could not load layer ${i} for export: ${state[key]}`);
        resolve(); // skip broken images rather than aborting
      };
      // Bust cache to avoid cross-origin taint on cached non-CORS responses
      img.src = state[key] + '?_=' + Date.now();
    });
  }

  canvas.toBlob((blob) => {
    if (!blob) {
      alert('Failed to generate PNG. Make sure at least one layer is selected.');
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'emblem.png';
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

// ─── Bind Buttons ────────────────────────────────────────────────────────────

function bindActions() {
  document.getElementById('exportBtn').addEventListener('click', exportJSON);
  document.getElementById('saveImgBtn').addEventListener('click', saveAsPNG);

  const importBtn = document.getElementById('importBtn');
  const importFile = document.getElementById('importFile');

  importBtn.addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', (e) => {
    importJSON(e.target.files[0]);
    // Reset so the same file can be re-loaded
    e.target.value = '';
  });
}

// ─── Boot ────────────────────────────────────────────────────────────────────

init();
