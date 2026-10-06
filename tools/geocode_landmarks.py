import json,urllib.parse,subprocess,time
from pathlib import Path
root=Path(__file__).resolve().parent.parent
queries={'pont-alexandre-iii':'Pont Alexandre III Paris','parc-de-bagatelle':'Parc de Bagatelle Paris','fontaine-stravinsky':'Fontaine Stravinsky Paris','place-stravinsky-wall':'Place Igor Stravinsky Paris','rosa-bonheur-buttes-chaumont':'Rosa Bonheur Paris Buttes Chaumont','lamarck-caulaincourt':'Lamarck Caulaincourt Paris','canal-saint-martin-cruise':'Port de l Arsenal Paris','statue-liberte-ile-aux-cygnes':'Statue de la Liberte Ile aux Cygnes Paris'}
results={}
for k,q in queries.items():
 url='https://data.geopf.fr/geocodage/search?'+urllib.parse.urlencode({'q':q,'index':'poi','limit':3})
 try:
  d=json.loads(subprocess.check_output(['curl','-sS','--max-time','12',url]));results[k]={'url':url,**d}
  print(k,[(x['properties'].get('name'),x['geometry']['coordinates']) for x in d.get('features',[])],flush=True)
 except Exception as e:print(k,'failed',flush=True)
 time.sleep(.3)
(root/'content/landmark-evidence.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
