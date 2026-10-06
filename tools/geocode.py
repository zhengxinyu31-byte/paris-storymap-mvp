import json,re,time,subprocess,urllib.parse
from pathlib import Path
root=Path(__file__).resolve().parent.parent
out=root/'content/coordinates.json';cache=root/'content/geocode-evidence.json'
coords=json.loads(out.read_text()) if out.exists() else {}
evidence=json.loads(cache.read_text()) if cache.exists() else {}
overrides={'bouquinistes-quais-de-seine':'Quai de la Tournelle 75005 Paris','canal-saint-martin-cruise':'Port de l Arsenal 75012 Paris','le-train-bleu':'Place Louis Armand 75012 Paris','coulee-verte-rene-dumont':'1 Avenue Daumesnil 75012 Paris','petite-ceinture-12e':'21 Rue Rottembourg 75012 Paris','pc20-couronnes':'Rue des Couronnes 75020 Paris','rotonde-bassin-de-la-villette':'6 Place de la Bataille de Stalingrad 75019 Paris','grande-mosquee-de-paris':'39 rue Geoffroy Saint Hilaire 75005 Paris','parc-de-bagatelle':'Parc de Bagatelle Paris','villa-leandre':'23 Avenue Junot 75018 Paris','mur-des-je-taime':'14 Place des Abbesses 75018 Paris','fontaine-stravinsky':'Place Igor Stravinsky 75004 Paris','place-stravinsky-wall':'Place Igor Stravinsky 75004 Paris','invader-pa-1500-pompidou':'Place Georges Pompidou 75004 Paris','rue-du-chat-qui-peche':'Rue du Chat qui Peche 75005 Paris','medaillons-arago':'Place Colette 75001 Paris','sentier-des-merisiers':'101 boulevard Soult 75012 Paris','statue-liberte-ile-aux-cygnes':'Pont de Grenelle Paris'}
for p in json.loads((root/'src/data/pois.json').read_text()):
 if p.get('coordinates') or p['id'] in coords or p.get('parent_poi_id'):continue
 q=overrides.get(p['id'])
 if not q:
  q=re.split('[；，｜（]| / ',p['address'])[0]
  q=re.sub(r'^[^A-Za-z0-9]+','',q)
  if 'Paris' not in q and not p.get('outside_paris'):q+=' Paris'
 url='https://data.geopf.fr/geocodage/search?'+urllib.parse.urlencode({'q':q,'limit':1})
 try:
  raw=subprocess.check_output(['curl','-L','-sS','--connect-timeout','5','--max-time','12',url])
  d=json.loads(raw);f=d.get('features',[None])[0]
  if not f:continue
  lon,lat=f['geometry']['coordinates'];pr=f['properties'];score=pr.get('score',0)
  evidence[p['id']]={'query':q,'url':url,'result':f}
  if 1.4<lon<3.6 and 48.1<lat<49.3 and score>=.55:
   coords[p['id']]={'lat':lat,'lon':lon,'status':'geocoded_address_unverified_entrance','source':'IGN Géoplateforme / BAN','matched_label':pr.get('label'),'score':score}
   print(p['id'],pr.get('label'),round(score,2),flush=True)
  else:print('REVIEW',p['id'],pr.get('label'),score,flush=True)
 except Exception as e:print('UNAVAILABLE',p['id'],str(e)[:70],flush=True)
 out.write_text(json.dumps(coords,ensure_ascii=False,indent=2));cache.write_text(json.dumps(evidence,ensure_ascii=False,indent=2));time.sleep(.35)
