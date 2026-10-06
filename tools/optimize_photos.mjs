// Re-encode reviewed local photographs as WebP. Requires the local dev server.
import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const manifest='content/photo-manifest.json';
const media=JSON.parse(await fs.readFile(manifest,'utf8'));
const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
let before=0,after=0;const replaced=[];
try{const p=await b.newPage();await p.goto(process.env.PHOTO_BASE_URL||'http://127.0.0.1:5175/');
 for(const [id,m] of Object.entries(media)){
  const oldPath='public'+m.src;const original=await fs.readFile(oldPath);before+=original.length;
  if(m.src.endsWith('.webp')){after+=original.length;continue}
  const result=await p.evaluate(async(src)=>{const img=new Image();img.src=src;await img.decode();const scale=Math.min(1,1200/Math.max(img.naturalWidth,img.naturalHeight));const c=document.createElement('canvas');c.width=Math.round(img.naturalWidth*scale);c.height=Math.round(img.naturalHeight*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);return {data:c.toDataURL('image/webp',.78).split(',')[1],width:c.width,height:c.height}},m.src);
  const data=Buffer.from(result.data,'base64');const newSrc='/photos/'+id+'.webp';await fs.writeFile('public'+newSrc,data);
  Object.assign(m,{src:newSrc,width:result.width,height:result.height,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')});
  after+=data.length;if(oldPath!=='public'+newSrc)replaced.push(oldPath);
 }
 for(const file of [manifest,'src/data/media.json'])await fs.writeFile(file,JSON.stringify(media,null,2)+'\n');
 for(const oldPath of replaced)await fs.unlink(oldPath);
 console.log(JSON.stringify({photos:Object.keys(media).length,before,after,reduction:Math.round((1-after/before)*100)+'%'}));
}finally{await b.close()}
