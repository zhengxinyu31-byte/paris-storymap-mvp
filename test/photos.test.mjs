import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const pois=read('src/data/pois.json');const media=read('src/data/media.json');
test('every POI has a reviewed local photograph and a resolvable media relation',()=>{
 assert.equal(Object.keys(media).length,pois.length);
 assert.deepEqual(media,read('content/photo-manifest.json'));
 for(const poi of pois){const m=media[poi.id];assert.ok(m,poi.id);assert.deepEqual(poi.media,[poi.id]);assert.equal(poi.media_status,'photo_verified');assert.match(m.src,/^\/photos\/[a-z0-9-]+\.webp$/);assert.ok(m.alt&&m.source_url&&m.verified_on);assert.match(m.source_url,/^https:\/\//);const bytes=readFileSync('public'+m.src);assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');assert.equal(createHash('sha256').update(bytes).digest('hex'),m.sha256,poi.id);assert.equal(bytes.length,m.bytes);assert.ok(m.width>150&&m.height>150);}
});
test('different cemetery plots, historical bookshops and Rosa locations use distinct photos',()=>{
 for(const ids of [pois.filter(p=>p.id.startsWith('pere-lachaise-')).map(p=>p.id),['shakespeare-bucherie','shakespeare-odeon'],['rosa-bonheur-sur-seine','rosa-bonheur-buttes-chaumont'],['petite-ceinture-12e','bois-de-charonne-pc20','pc20-couronnes']])assert.equal(new Set(ids.map(id=>media[id].sha256)).size,ids.length);
});
