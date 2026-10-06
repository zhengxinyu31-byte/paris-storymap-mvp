"""Collect public image candidates. Human selection is required before publication."""
import json, pathlib, urllib.request, urllib.parse, concurrent.futures, time, re
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'content/photo-research'
OUT.mkdir(exist_ok=True)
UA='ParisStoryMap/1.0 (POI illustration research; local prototype)'
def fetch_json(params):
 url='https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(params)
 for attempt in range(3):
  try:
   req=urllib.request.Request(url,headers={'User-Agent':UA})
   with urllib.request.urlopen(req,timeout=35) as r:return json.load(r)
  except Exception:
   if attempt==2:raise
   time.sleep(2+attempt*3)
def search(row):
 pid,query=row
 file=OUT/(pid+'.json')
 if file.exists():return pid,'cached'
 try:
  d=fetch_json({'action':'query','format':'json','generator':'search','gsrsearch':query,'gsrnamespace':6,'gsrlimit':5,'prop':'imageinfo','iiprop':'url|extmetadata|size','iiurlwidth':1100})
  candidates=[]
  for p in sorted(d.get('query',{}).get('pages',{}).values(),key=lambda p:p.get('index',0)):
   for im in p.get('imageinfo',[]):
    m=im.get('extmetadata',{});clean=lambda k: re.sub('<[^>]+>','',m.get(k,{}).get('value',''))
    candidates.append({'title':p['title'],'image_url':im.get('thumburl',im['url']),'original_url':im['url'],'source_url':im.get('descriptionurl'),'width':im.get('thumbwidth',im.get('width')),'height':im.get('thumbheight',im.get('height')),'description':clean('ImageDescription'),'author':clean('Artist'),'license':clean('LicenseShortName'),'license_url':clean('LicenseUrl'),'date':clean('DateTimeOriginal'),'original_width':im.get('width'),'original_height':im.get('height')})
  file.write_text(json.dumps({'poi_id':pid,'query':query,'candidates':candidates},ensure_ascii=False,indent=2))
  return pid,len(candidates)
 except Exception as e:return pid,str(e)
if __name__=='__main__':
 rows=json.loads((ROOT/'content/photo-queries.json').read_text())
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
  for result in pool.map(search,rows.items()):print(*result,flush=True)
