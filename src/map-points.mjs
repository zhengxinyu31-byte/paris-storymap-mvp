export function mapPoints(route) {
 const groups=new Map();
 route.stops.forEach((stop,index)=>{
  if(!Number.isFinite(stop.poi.coordinates?.lon)||!Number.isFinite(stop.poi.coordinates?.lat))return;
  const key=stop.poi.map_group_id||stop.poi.id;
  if(!groups.has(key))groups.set(key,{id:key,poi:stop.poi,index,indexes:[],name:stop.poi.map_label||stop.poi.name_zh});
  groups.get(key).indexes.push(index);
 });
 return [...groups.values()];
}
// Mercator positions for the local fallback; no invented roads or precise grave pins.
export function overviewPositions(points) {
 const xy=points.map(p=>[p.poi.coordinates.lon,Math.log(Math.tan(Math.PI/4+p.poi.coordinates.lat*Math.PI/360))*180/Math.PI]);
 if(!xy.length)return [];
 const xs=xy.map(p=>p[0]),ys=xy.map(p=>p[1]);
 const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 const dx=Math.max(maxX-minX,.006),dy=Math.max(maxY-minY,.008);
 const centerX=(minX+maxX)/2,centerY=(minY+maxY)/2;
 const result=xy.map(([x,y])=>({x:50+(x-centerX)/dx*64,y:46-(y-centerY)/dy*58}));
 // Separate nearby buttons for touch access; thin leader lines retain their true positions.
 return result.map((p,i)=>{
  let x=p.x,y=p.y;
  for(let n=0;n<20;n++){
   const collision=result.slice(0,i).find(q=>Math.hypot(x-(q.labelX??q.x),y-(q.labelY??q.y))<11);
   if(!collision)break;
   x=Math.max(10,Math.min(90,p.x+Math.cos(n*2.4+i)* (12+Math.floor(n/6)*6)));
   y=Math.max(16,Math.min(79,p.y+Math.sin(n*2.4+i)* (12+Math.floor(n/6)*6)));
  }
  p.labelX=x;p.labelY=y;
  return p;
 });
}

// Spread overlapping labels, with leader lines back to the unchanged coordinates.
export function spreadPointLabels(input,gap=46,bounds) {
 const placed=[];
 return input.map(point=>{
  let label={x:point.x,y:point.y};
  if(placed.some(q=>Math.hypot(q.x-label.x,q.y-label.y)<gap)){
   for(let n=0;n<90;n++){
    const radius=gap*(1+Math.floor(n/12)*.55),angle=n*2.399963;
    const candidate={x:point.x+Math.cos(angle)*radius,y:point.y+Math.sin(angle)*radius};
    const initiallyVisible=bounds&&point.x>=25&&point.x<=bounds.width-25&&point.y>=25&&point.y<=bounds.height-25;
    if(initiallyVisible&&(candidate.x<25||candidate.x>bounds.width-25||candidate.y<25||candidate.y>bounds.height-25))continue;
    if(placed.every(q=>Math.hypot(q.x-candidate.x,q.y-candidate.y)>=gap)){label=candidate;break;}
   }
  }
  placed.push(label);return {...label,offset:[label.x-point.x,label.y-point.y]};
 });
}
