// Shim globals for geotiff browser bundle in Node.js
global.self = global;
global.window = global;
global.document = {
  createElement: () => ({ getContext: () => null, style: {} }),
  createElementNS: () => ({}),
  body: { appendChild: () => {}, removeChild: () => {} }
};
global.navigator = { userAgent: 'node.js', appName: 'node' };
global.location = { href: 'http://localhost' };
global.Blob = class Blob { constructor(parts, opts) { this.size = 0; this.type = ''; } };
global.FileReader = class FileReader {
  readAsArrayBuffer() { if (this.onload) this.onload({ target: { result: new ArrayBuffer(0) } }); }
  readAsDataURL() {}
};
global.Image = class Image { constructor() { this.width = 0; this.height = 0; this.onload = null; this.onerror = null; this.src = ''; } };
global.XMLHttpRequest = class XMLHttpRequest {
  open() {}
  send() { if (this.onerror) this.onerror(); }
  get responseType() { return this._rt; }
  set responseType(v) { this._rt = v; }
  get response() { return null; }
};
global.Worker = undefined;
global.OffscreenCanvas = undefined;
global.createImageBitmap = undefined;
global.fetch = undefined;
global.URL = { createObjectURL: () => '', revokeObjectURL: () => {} };
global.TextDecoder = TextDecoder;
global.TextEncoder = TextEncoder;
global.atob = (s) => Buffer.from(s, 'base64').toString('binary');
global.btoa = (s) => Buffer.from(s, 'binary').toString('base64');
global.requestAnimationFrame = (fn) => setTimeout(fn, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);
global.addEventListener = () => {};
global.removeEventListener = () => {};

// Also shim the global `exports` and `module` that the UMD expects
const _module = { exports: {} };
const _exports = _module.exports;

try {
  const GeoTIFF = require('./geotiff.bundle.min.cjs');
  console.log('SUCCESS!');
  console.log('type:', typeof GeoTIFF);
  console.log('Keys:', Object.keys(GeoTIFF));
  console.log('fromFile:', typeof GeoTIFF.fromFile);
  console.log('fromArrayBuffer:', typeof GeoTIFF.fromArrayBuffer);
  if (GeoTIFF.fromArrayBuffer) {
    const fs = require('fs');
    const path = require('path');
    const buf = fs.readFileSync(path.join(__dirname, '../public/data/dem/copernicus_glo30.tif'));
    console.log('Reading tif file, size:', buf.length);
    GeoTIFF.fromArrayBuffer(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength))
      .then(tiff => tiff.getImage())
      .then(img => console.log('✅ Image:', img.getWidth(), 'x', img.getHeight()))
      .catch(e => console.error('❌ Parse error:', e.message));
  }
} catch(e) {
  console.error('ERROR:', e.constructor.name, e.message);
  console.error(e.stack.split('\n').slice(0, 8).join('\n'));
}
