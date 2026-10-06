import test from 'node:test';
import assert from 'node:assert/strict';
import {routeSegments,segmentFeatures,navigationUrl} from '../src/route-paths.mjs';
const stop=(id,lon)=>({poi:{id,coordinates:lon===null?null:{lon,lat:48.85}}});
const route={id:'r',stops:[stop('a',2.3),stop('b',2.31),stop('c',2.32)]};
const cached={r:{segments:[{from_poi_id:'a',to_poi_id:'b',from_coordinates:[2.3,48.85],to_coordinates:[2.31,48.85],coordinates:[[2.3,48.85],[2.305,48.851],[2.31,48.85]],mode:'walk',distance_m:900,duration_s:700}]}};
test('ordered adjacent pairs are always present; only matching geometry is used',()=>{
 const legs=routeSegments(route,cached);assert.equal(legs.length,2);assert.deepEqual(legs[0].coordinates,cached.r.segments[0].coordinates);assert.deepEqual(legs[1].coordinates,[[2.31,48.85],[2.32,48.85]]);
 assert.deepEqual(legs.map(x=>[x.from_poi_id,x.to_poi_id]),[['a','b'],['b','c']]);assert.equal(segmentFeatures(legs).features.length,2);
});
test('reordered or relocated stops cannot reuse stale paths',()=>{
 assert.deepEqual(routeSegments({...route,stops:[route.stops[1],route.stops[0],route.stops[2]]},cached)[0].coordinates,[[2.31,48.85],[2.3,48.85]]);
 assert.deepEqual(routeSegments({...route,stops:[stop('a',2.301),...route.stops.slice(1)]},cached)[0].coordinates,[[2.301,48.85],[2.31,48.85]]);
});
test('missing coordinates do not create a false shortcut over a chapter',()=>{
 const legs=routeSegments({...route,stops:[stop('a',2.3),stop('b',null),stop('c',2.32)]},{});
 assert.equal(legs.length,2);assert(legs.every(x=>x.coordinates.length===0));assert.equal(segmentFeatures(legs).features.length,0);
});

test('legacy travel classifications never affect route display or prescribe navigation mode',()=>{
 for(const mode of ['walk','transfer']){
  const legs=routeSegments(route,{r:{segments:[{...cached.r.segments[0],mode}]}});
  assert(legs.every(leg=>!('mode' in leg)));
  assert(segmentFeatures(legs).features.every(feature=>!('mode' in feature.properties)));
 }
 const url=new URL(navigationUrl(route.stops[0],route.stops[1]));
 assert.equal(url.searchParams.get('origin'),'48.85,2.3');assert.equal(url.searchParams.get('destination'),'48.85,2.31');assert.equal(url.searchParams.has('travelmode'),false);
});

test('every published itinerary has current geometry for each adjacent stop',async()=>{
 const {readFileSync}=await import('node:fs');const read=name=>JSON.parse(readFileSync(`src/data/${name}.json`,'utf8'));
 const pois=new Map(read('pois').map(p=>[p.id,p])),paths=read('paths');
 for(const r of read('routes')){
  const legs=routeSegments({...r,stops:r.stops.map(s=>({...s,poi:pois.get(s.poi_id)}))},paths);
  assert.equal(legs.length,r.stops.length-1,r.id);
  for(const leg of legs){assert(!('mode' in leg));assert.deepEqual(leg.coordinates[0],leg.from_coordinates);assert.deepEqual(leg.coordinates.at(-1),leg.to_coordinates);}
  assert(paths[r.id].segments.every(leg=>!('mode' in leg)));
 }
});
