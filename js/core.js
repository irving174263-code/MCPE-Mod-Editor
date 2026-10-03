const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function uuid(){return crypto.randomUUID?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:(r&3|8)).toString(16)})}
function slug(s){return String(s).toLowerCase().trim().replace(/[^a-z0-9_ -]/g,'').replace(/[ -]+/g,'_').replace(/^_+|_+$/g,'')}
const ver=s=>String(s).split('.').map(x=>parseInt(x,10)||0);
/* Minimal ZIP writer: STORE method, no external libraries. */
const CRC_TABLE=(()=>{let t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);t[n]=c>>>0}return t})();
function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=CRC_TABLE[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0}
function u16(n){return new Uint8Array([n&255,(n>>>8)&255])}
function u32(n){return new Uint8Array([n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255])}
function cat(...arrs){let n=arrs.reduce((a,b)=>a+b.length,0),o=new Uint8Array(n),p=0;for(const a of arrs){o.set(a,p);p+=a.length}return o}
const enc=new TextEncoder();
function zip(files){
  let locals=[], central=[], offset=0;
  for(const f of files){
    const name=enc.encode(f.name), data=typeof f.data==='string'?enc.encode(f.data):f.data, crc=crc32(data);
    const local=cat(u32(0x04034b50),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),name,data);
    locals.push(local);
    const c=cat(u32(0x02014b50),u16(20),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),name);
    central.push(c); offset+=local.length;
  }
  const body=cat(...locals), cent=cat(...central);
  const end=cat(u32(0x06054b50),u16(0),u16(0),u16(files.length),u16(files.length),u32(cent.length),u32(body.length),u16(0));
  return cat(body,cent,end);
}


function download(bytes,name,mime='application/octet-stream'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([bytes],{type:mime}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500)}
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2600)}
function dataToBytes(u){const b=atob(u.split(',')[1]),o=new Uint8Array(b.length);for(let i=0;i<b.length;i++)o[i]=b.charCodeAt(i);return o}

/* Texturas generadas (si no subes PNG) */
function genTex(kind,color){
  const n=kind==='entity'?64:16,c=document.createElement('canvas');c.width=c.height=n;const g=c.getContext('2d');
  if(kind==='item'){g.fillStyle=color;g.beginPath();g.moveTo(8,1);g.lineTo(15,8);g.lineTo(8,15);g.lineTo(1,8);g.closePath();g.fill();g.fillStyle='rgba(255,255,255,.35)';g.fillRect(6,5,3,3)}
  else{g.fillStyle=color;g.fillRect(0,0,n,n);g.fillStyle='rgba(0,0,0,.18)';const s=kind==='entity'?8:4;for(let i=0;i<n;i+=s*2)g.fillRect(i,0,s/2,n);g.strokeStyle='rgba(0,0,0,.35)';g.strokeRect(.5,.5,n-1,n-1)}
  return c.toDataURL('image/png');
}
const texBytes=(o,kind)=>dataToBytes(o.tex||genTex(kind,o.color||'#888888'));

/* NBT little-endian para .mcstructure */
class NB{constructor(){this.a=[]}
  u8(v){this.a.push(v&255)} i16(v){this.u8(v);this.u8(v>>8)} i32(v){for(let i=0;i<4;i++)this.u8(v>>(8*i))}
  str(s){const b=enc.encode(s);this.i16(b.length);for(const x of b)this.a.push(x)} tag(t,n){this.u8(t);this.str(n)}
  list(t,arr,fn){this.u8(t);this.i32(arr.length);arr.forEach(fn)}}
function mcstructure(s){
  const n=new NB(),total=s.sx*s.sy*s.sz;
  n.tag(10,'');n.tag(3,'format_version');n.i32(1);
  n.tag(9,'size');n.list(3,[s.sx,s.sy,s.sz],v=>n.i32(v));
  n.tag(9,'structure_world_origin');n.list(3,[0,0,0],v=>n.i32(v));
  n.tag(10,'structure');
  n.tag(9,'block_indices');n.u8(9);n.i32(2);
  n.list(3,s.cells,v=>n.i32(v));n.list(3,Array(total).fill(-1),v=>n.i32(v));
  n.tag(9,'entities');n.u8(10);n.i32(0);
  n.tag(10,'palette');n.tag(10,'default');
  n.tag(9,'block_palette');n.list(10,s.pal,id=>{n.tag(8,'name');n.str(id);n.tag(10,'states');n.u8(0);n.tag(3,'version');n.i32(18153475);n.u8(0)});
  n.tag(10,'block_position_data');n.u8(0);
  n.u8(0);n.u8(0);n.u8(0);n.u8(0);
  return new Uint8Array(n.a);
}
