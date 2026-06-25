const results = [];

const svc = (id, url) => [id, url];

const services = [
  svc('wms-nasa-gibs-3857', 'https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0'),
  svc('wms-emodnet-geology', 'https://drive.emodnet-geology.eu/geoserver/wms?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0'),
  svc('wms-sedac-population', 'https://sedac.ciesin.columbia.edu/geoserver/wms?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0'),
  svc('wms-isric-soil', 'https://maps.isric.org/mapserv?map=/map/soilgrids250m.map&SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0'),
  svc('wms-unep-protected-areas', 'https://data-gis.unep-wcmc.org/wms?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0'),
  svc('wms-fao-gaez-land', 'https://gaez.fao.org/server/services/wms?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0'),
  svc('wms-ign-france-geology', 'https://geoservices.brgm.fr/geologie?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0'),
];

for (const [id, url] of services) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const xml = await r.text();
    const matches = [...xml.matchAll(/<Name>([^<]+)<\/Name>/gi)].map(m => m[1]);
    const names = matches.filter(n => n && n.length >= 1 && !/^\d+$/.test(n) && !/^(true|false|WMS|wms)$/i.test(n));
    results.push({ id, layerName: names[0] || '(not found)', first5: names.slice(0, 5).join(', ') });
    console.log('OK:', id, '->', names[0] || '(none)');
  } catch (e) {
    results.push({ id, layerName: 'ERROR: ' + e.message.slice(0, 50) });
    console.warn('ERR:', id, '->', e.message);
  }
}

console.table(results);
