"""Materialize reviewed POI photographs locally; no paid API or runtime hotlinks.
macOS: Python standard library and sips. Human selections live in content/.
"""
import concurrent.futures, hashlib, json, pathlib, re, shutil, subprocess, tempfile, time, urllib.request, urllib.parse
ROOT=pathlib.Path(__file__).resolve().parents[1]
DEST=ROOT/'public/photos';DEST.mkdir(exist_ok=True)
CACHE=pathlib.Path(tempfile.gettempdir())/'paris-poi-photo-cache';CACHE.mkdir(exist_ok=True)
def read(p):return json.loads(p.read_text())
def write(p,d):p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def candidates():
 pois={p['id']:p for p in read(ROOT/'src/data/pois.json')};rows=[]
 for pid,index in read(ROOT/'content/photo-selections.json').items():
  c=read(ROOT/'content/photo-research'/f'{pid}.json')['candidates'][index].copy()
  c.update(poi_id=pid,alt=pois[pid]['name_zh']+'实景',match_note=c.get('description') or c['title'])
  rows.append(c)
 for f in sorted((ROOT/'content').glob('photo-special-*.json')):rows.extend(read(f))
 assert len({x['poi_id'] for x in rows})==len(rows),'duplicate POI'
 return rows
def materialize(row):
 pid=row['poi_id'];dst=DEST/(pid+'.jpg');raw=CACHE/(pid+'.raw');url=row['image_url']
 try:
  previous=read(ROOT/'content/photo-manifest.json').get(pid,{}) if (ROOT/'content/photo-manifest.json').exists() else {}
  existing=ROOT/'public'/previous.get('src','').lstrip('/')
  if previous.get('image_url')==url and existing.is_file():return pid,previous,None
  if previous.get('image_url') and previous['image_url']!=url:
   for stale in [dst,raw]:
    if stale.is_file():stale.unlink()
  if not dst.exists():
   paths=[row.get('local_path'),str(pathlib.Path('/tmp/paris-special-photos')/(pid+'.jpg')),str(pathlib.Path('/tmp/paris-special-photos')/(pid+'.webp'))]
   local=next((pathlib.Path(p) for p in paths if p and pathlib.Path(p).is_file()),None)
   if local:shutil.copyfile(local,raw)
   if not raw.exists():
    urls=[url]
    if 'upload.wikimedia.org' in url and '/thumb/' in url:urls.insert(0,url.replace('upload.wikimedia.org','thumb.wikimedia.org'))
    if row.get('original_url'):urls.append(row['original_url'])
    errors=[]
    for source in urls:
     try:
      req=urllib.request.Request(source,headers={'User-Agent':'ParisStoryMap/1.0 (POI image cache; local prototype)'})
      with urllib.request.urlopen(req,timeout=35) as response:
       content=response.read(25_000_001)
       if len(content)>25_000_000:raise ValueError('image exceeds 25 MB')
       if not (content[:3]==b'\xff\xd8\xff' or content[:8]==b'\x89PNG\r\n\x1a\n' or content[:4]==b'RIFF'):raise ValueError('not a JPEG/PNG/WebP')
       raw.write_bytes(content)
      break
     except Exception as e:errors.append(str(e))
    else:raise ValueError('; '.join(errors))
   temp=DEST/(pid+'.pending.jpg')
   proc=subprocess.run(['sips','-s','format','jpeg','-s','formatOptions','76','-Z','1200',str(raw),'--out',str(temp)],capture_output=True,text=True)
   if proc.returncode or not temp.exists():raise ValueError('image conversion failed: '+proc.stderr)
   temp.replace(dst)
  info=subprocess.check_output(['sips','-g','pixelWidth','-g','pixelHeight',str(dst)],text=True)
  w=int(re.search(r'pixelWidth: (\d+)',info).group(1));h=int(re.search(r'pixelHeight: (\d+)',info).group(1))
  if min(w,h)<160:raise ValueError('image too small')
  result={k:v for k,v in row.items() if k in ['alt','image_url','source_url','match_note','author','license','license_url','date','caption'] and v}
  result.update(src='/photos/'+dst.name,width=w,height=h,bytes=dst.stat().st_size,sha256=hashlib.sha256(dst.read_bytes()).hexdigest())
  result['fit']='cover'
  return pid,result,None
 except Exception as e:return pid,None,str(e)
if __name__=='__main__':
 manifest=ROOT/'content/photo-manifest.json';media=read(manifest) if manifest.exists() else read(ROOT/'src/data/media.json')
 errors={}
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
  for pid,result,error in pool.map(materialize,candidates()):
   if error:errors[pid]=error;print('FAIL',pid,error,flush=True)
   else:media[pid]=result;print('OK',pid,result['bytes'],flush=True)
 write(manifest,media);write(ROOT/'src/data/media.json',media);write(ROOT/'content/photo-download-errors.json',errors)
 print('TOTAL',len(media),'photos;',len(errors),'failed')
