"""Refresh ordered route legs from FOSSGIS OSRM foot. Cached, at most one request/second.
Run explicitly after POI/route edits; the app itself never calls this API.
"""
import json,time,subprocess,hashlib,datetime
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
DATA=ROOT/'src/data';OUT=DATA/'paths.json'
pois={p['id']:p for p in json.loads((DATA/'pois.json').read_text())}
routes=json.loads((DATA/'routes.json').read_text());old=json.loads(OUT.read_text()) if OUT.exists() else {};result={}
for route in routes:
 stops=[pois[s['poi_id']] for s in route['stops']]
 coords=[[p.get('coordinates',{}).get('lon'),p.get('coordinates',{}).get('lat')] for p in stops]
 if any(None in p for p in coords):raise ValueError('Missing coordinates: '+route['id'])
 fingerprint=hashlib.sha256(json.dumps([(p['id'],c) for p,c in zip(stops,coords)]).encode()).hexdigest()
 if old.get(route['id'],{}).get('fingerprint')==fingerprint:
  result[route['id']]=old[route['id']]
  for segment in result[route['id']]['segments']:segment.pop('mode',None)
  continue
 legs=[];error=None;waypoints=[]
 try:
  url='https://routing.openstreetmap.de/routed-foot/route/v1/driving/'+ ';'.join(','.join(str(n) for n in c) for c in coords)+'?overview=false&geometries=geojson&steps=true'
  time.sleep(1.1)
  data=json.loads(subprocess.check_output(['curl','-fsSL','--compressed','--max-time','60','-A','ParisStorymapMVP/1.0 (static itinerary preview)',url],text=True))
  if data.get('code')!='Ok':raise ValueError(data.get('code'))
  legs=data['routes'][0]['legs'];waypoints=data['waypoints']
 except Exception as e:error=str(e);print(route['id'],'routing unavailable:',error,flush=True)
 segments=[]
 for i,(a,b) in enumerate(zip(stops,stops[1:])):
  s={'from_poi_id':a['id'],'to_poi_id':b['id'],'from_coordinates':coords[i],'to_coordinates':coords[i+1],'coordinates':[coords[i],coords[i+1]]}
  if legs:
   leg=legs[i];offsets=[round(waypoints[k]['distance'],1) for k in [i,i+1]]
   s.update(distance_m=round(leg['distance']),duration_s=round(leg['duration']),access_offsets_m=offsets)
   if max(offsets)<=120:
    points=[coords[i]]+[c for step in leg['steps'] for c in step['geometry']['coordinates']]+[coords[i+1]]
    s['coordinates']=[c for j,c in enumerate(points) if j==0 or c!=points[j-1]]
   else:print(route['id'],a['id'],'large access offset',offsets,flush=True)
  segments.append(s)
 result[route['id']]={'fingerprint':fingerprint,'provider':'FOSSGIS OSRM foot','attribution':'© OpenStreetMap contributors · Routing by FOSSGIS','generated_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'segments':segments}
 # Failures are retried on the next explicit run.
 if error:result[route['id']].pop('fingerprint');result[route['id']]['error']=error
 print(route['id'],len(segments),'ordered connections',flush=True)
 # Incremental writes preserve work if the network stops.
 OUT.write_text(json.dumps({**old,**result},ensure_ascii=False,separators=(',',':'))+'\n')
OUT.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n')
