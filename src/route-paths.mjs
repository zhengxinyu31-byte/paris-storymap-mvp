const coordinate=stop=>{
 const p=stop?.poi?.coordinates;
 return Number.isFinite(p?.lon)&&Number.isFinite(p?.lat)?[p.lon,p.lat]:null;
};
const same=(a,b)=>a&&b&&a.every((n,i)=>Math.abs(n-b[i])<1e-7);
// Keep every adjacent chapter, including missing locations. Never bridge a gap silently.
export function routeSegments(route,cache={}) {
 return route.stops.slice(0,-1).map((from,index)=>{
  const to=route.stops[index+1],a=coordinate(from),b=coordinate(to);
  const base={index,from_poi_id:from.poi.id,to_poi_id:to.poi.id,from_coordinates:a,to_coordinates:b};
  if(!a||!b)return {...base,coordinates:[]};
  const saved=cache[route.id]?.segments.find(s=>s.from_poi_id===from.poi.id&&s.to_poi_id===to.poi.id&&same(s.from_coordinates,a)&&same(s.to_coordinates,b));
  return {...base,coordinates:saved?.coordinates||[a,b]};
 });
}
export function segmentFeatures(segments) {
 return {type:'FeatureCollection',features:segments.filter(s=>s.coordinates.length>1).map(s=>({type:'Feature',properties:{index:s.index},geometry:{type:'LineString',coordinates:s.coordinates}}))};
}
export function navigationUrl(from,to) {
 const a=coordinate(from),b=coordinate(to);if(!a||!b)return null;
 const params=new URLSearchParams({api:'1',origin:`${a[1]},${a[0]}`,destination:`${b[1]},${b[0]}`});
 return `https://www.google.com/maps/dir/?${params}`;
}
