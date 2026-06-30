import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Buffer } from 'buffer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '..', 'public/data/gis/models/glb');
fs.mkdirSync(outDir, { recursive: true });

// Full FileReader polyfill
class NodeFileReader {
  constructor() {
    this.result = null;
    this.readyState = 0;
    this._emitter = { listeners: {} };
  }
  get onload() { return this._onload; }
  set onload(fn) { this._onload = fn; }
  get onerror() { return this._onerror; }
  set onerror(fn) { this._onerror = fn; }
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then(buf => {
      this.result = buf;
      this.readyState = 2;
      if (this._onload) this._onload({ target: this });
    }).catch(e => {
      if (this._onerror) this._onerror(e);
    });
  }
  addEventListener() {}
  removeEventListener() {}
}
globalThis.FileReader = NodeFileReader;
globalThis.Blob = Blob || class Blob2 { constructor(parts) { this._parts = parts; } arrayBuffer() { return Promise.resolve(Buffer.concat(this._parts.map(p => Buffer.from(p)))); } };

async function main() {
  function exportScene(scene, filename) {
    return new Promise((resolve, reject) => {
      const exporter = new GLTFExporter();
      try {
        exporter.parse(scene, (result) => {
          try {
            fs.writeFileSync(path.join(outDir, filename), Buffer.from(result));
            console.log('Created:', filename, '(' + (result.byteLength / 1024).toFixed(1) + ' KB)');
            resolve();
          } catch(e) { reject(e); }
        }, (err) => {
          console.error('Export error:', filename, err);
          reject(err);
        }, { binary: true });
      } catch(e) { reject(e); }
    });
  }

  const treeScene = new THREE.Scene();
  treeScene.add(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.2, 8), new THREE.MeshStandardMaterial({ color: 0x8B4513 })));
  // ... simplified tree
  for (let i = 0; i < 3; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.7 - i * 0.15, 0.8, 8), new THREE.MeshStandardMaterial({ color: 0x228B22 + i * 0x113300 }));
    leaf.position.y = 1.0 + i * 0.5;
    treeScene.add(leaf);
  }

  const houseScene = new THREE.Scene();
  const w = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.0, 1.6), new THREE.MeshStandardMaterial({ color: 0xf5deb3 }));
  w.position.y = 1.0; houseScene.add(w);
  const r = new THREE.Mesh(new THREE.ConeGeometry(1.3, 1.0, 4), new THREE.MeshStandardMaterial({ color: 0xcc3333 }));
  r.position.y = 2.5; r.rotation.y = Math.PI / 4; houseScene.add(r);

  await exportScene(treeScene, 'tree.glb');
  await exportScene(houseScene, 'house.glb');
  console.log('Done!');
}

main().catch(e => { console.error(e); process.exit(1); });
