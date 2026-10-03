/* Interfaz: pestañas, formularios genéricos, editor de estructuras, validador, exportar */
const R=[], ED={}, TMP={};
function persist(){try{localStorage.setItem('mcpe_editor_v03',JSON.stringify(S))}catch(e){}}
function renderAll(){R.forEach(f=>f());persist()}
function addTab(key,label,html){
  const b=document.createElement('button');b.className='tab';b.dataset.tab=key;b.textContent=label;$('#tabs').appendChild(b);
  const p=document.createElement('div');p.id=key;p.className='panel';p.innerHTML=html;$('#panels').appendChild(p);
  b.onclick=()=>{$$('.tab').forEach(x=>x.classList.remove('active'));$$('.panel').forEach(x=>x.classList.remove('active'));b.classList.add('active');p.classList.add('active');renderAll()};
  return p;
}

/* Formulario genérico: [clave, etiqueta, tipo, valor por defecto, opciones] */
function crud(key,label,title,desc,fields,sum,opts={}){
  const hasId=!opts.noId, kind=opts.kind;
  const html=f=>{const [k,l,t,d,o]=f,id=`f_${key}_${k}`;
    if(t==='check')return `<label class="chk"><input id="${id}" type="checkbox"> ${l}</label>`;
    if(t==='select')return `<label>${l}<select id="${id}">${o.map(x=>`<option value="${x[0]}">${x[1]}</option>`).join('')}</select></label>`;
    if(t==='area')return `<label>${l}<textarea id="${id}" ${o?`placeholder="${esc(o)}"`:''}></textarea></label>`;
    if(t==='tex')return `<label>${l}<input id="${id}" type="file" accept="image/png"></label>`;
    return `<label>${l}<input id="${id}" type="${t}" ${t==='number'?'step="any"':''}></label>`};
  const p=addTab(key,label,`<h2>${title}</h2><p class="muted">${desc}</p><div id="${key}_list"></div>
    <div class="card"><b id="${key}_t"></b>${fields.map(html).join('')}<p id="${key}_e" class="err"></p>
    <button id="${key}_s" class="primary">Guardar</button> <button id="${key}_c" class="secondary">Nuevo / cancelar</button></div>${opts.help||''}`);
  ED[key]=-1;
  const set=(o)=>{fields.forEach(([k,,t,d])=>{const el=$(`#f_${key}_${k}`);if(t==='tex'){el.value='';return}
    const v=o&&o[k]!==undefined?o[k]:d;if(t==='check')el.checked=!!v;else el.value=v})};
  const reset=()=>{ED[key]=-1;TMP[key]=null;$(`#${key}_t`).textContent='Nuevo';$(`#${key}_e`).textContent='';set(null)};
  const list=()=>{const a=S[key];$(`#${key}_list`).innerHTML=a.map((o,i)=>`<div class="ent"><span><b>${esc(o.name||o.id)}</b> <small>${esc(sum(o))}</small></span>
    <span><button data-e="${i}">Editar</button> <button class="danger" data-d="${i}">✕</button></span></div>`).join('')||'<p class="muted">Aún no hay elementos.</p>';
    $$(`#${key}_list [data-e]`).forEach(b=>b.onclick=()=>{ED[key]=+b.dataset.e;TMP[key]=null;set(a[ED[key]]);$(`#${key}_t`).textContent='Editando: '+(a[ED[key]].name||a[ED[key]].id)});
    $$(`#${key}_list [data-d]`).forEach(b=>b.onclick=()=>{a.splice(+b.dataset.d,1);reset();renderAll()})};
  fields.filter(f=>f[2]==='tex').forEach(([k])=>$(`#f_${key}_${k}`).onchange=e=>{const f=e.target.files[0];if(!f)return;
    const r=new FileReader();r.onload=()=>TMP[key]=r.result;r.readAsDataURL(f)});
  $(`#${key}_c`).onclick=reset;
  $(`#${key}_s`).onclick=()=>{
    const o={};fields.forEach(([k,,t,d])=>{const el=$(`#f_${key}_${k}`);if(t==='tex')return;o[k]=t==='check'?el.checked:t==='number'?(el.value===''?d:+el.value):el.value});
    const old=ED[key]>=0?S[key][ED[key]]:null;
    if(hasId){o.id=slug(o.id).replace(/^(\d)/,'x$1');if(!/^[a-z][a-z0-9_]*$/.test(o.id))return $(`#${key}_e`).textContent='El ID solo puede tener minúsculas, números y _ (y empezar con letra).';
      if(S[key].some((x,i)=>x.id===o.id&&i!==ED[key]))return $(`#${key}_e`).textContent='Ya existe un elemento con ese ID.'}
    else if(!o.name.trim())return $(`#${key}_e`).textContent='Ponle un nombre.';
    if(o.extra&&parseExtra(o.extra)===null)return $(`#${key}_e`).textContent='El JSON avanzado no es válido.';
    if(fields.some(f=>f[2]==='tex'))o.tex=TMP[key]||(old&&old.tex)||'';
    if(old)S[key][ED[key]]=o;else S[key].push(o);
    reset();renderAll();toast('Guardado');};
  R.push(list);reset();return p;
}
const EXTRA=['extra','Componentes JSON extra (avanzado, opcional)','area','','{"minecraft:burns_in_daylight":{}}'];

/* Pestaña Proyecto */
const PF=[['name','Nombre del Add-On'],['description','Descripción'],['author','Autor'],['version','Versión (1.0.0)'],['namespace','Namespace'],['minEngine','Versión mínima de Minecraft'],['serverApi','Versión de @minecraft/server (scripts)']];
const pp=addTab('project','📦 Proyecto',`<h2>Proyecto</h2>${PF.map(([k,l])=>`<label>${l}<input id="s_${k}"></label>`).join('')}
  <button id="saveP" class="secondary">💾 Guardar proyecto (.json)</button> <label class="secondary" style="display:inline-block;margin:8px 0">📂 Cargar proyecto<input id="loadP" type="file" accept=".json" style="display:none"></label>
  <p class="muted">Tu trabajo también se guarda solo en este navegador.</p>`);
const syncProject=()=>PF.forEach(([k])=>{const e=$('#s_'+k);if(document.activeElement!==e)e.value=S.settings[k]});
PF.forEach(([k])=>$('#s_'+k).oninput=e=>{S.settings[k]=e.target.value;persist()});
R.push(syncProject);
$('#saveP').onclick=()=>download(JSON.stringify(S),slug(S.settings.name)+'.mcmod.json','application/json');
$('#loadP').onchange=async e=>{try{loadState(JSON.parse(await e.target.files[0].text()));toast('Proyecto cargado')}catch{toast('Archivo inválido')}};
function loadState(o){Object.assign(S.settings,SET0,o.settings||{});['entities','items','blocks','recipes','rules','structures','scripts','files'].forEach(k=>S[k]=o[k]||[]);
  const M={message:'mensaje',command:'comando',effect:'efecto',summon:'invocar',structure:'estructura'};
  S.rules.forEach(r=>{if(r.acciones===undefined&&r.action){r.acciones=`${M[r.action]||'mensaje'}: ${r.value||''}${r.action==='effect'?` ${r.seconds||5} ${r.level||0}`:''}`;r.cond=r.cond||''}});renderAll()}

/* Entidades, ítems, bloques, recetas, comportamientos */
crud('entities','👾 Entidades','Entidades','Mobs personalizados: comportamiento (BP), apariencia (RP), loot y aparición natural.',[
  ['id','ID','text','zombie_custom'],['name','Nombre visible','text','Zombie Custom'],
  ['health','Vida','number',40],['speed','Velocidad','number',0.35],['damage','Daño de ataque','number',4],
  ['width','Ancho de colisión','number',0.6],['height','Alto de colisión','number',1.9],
  ['hostile','Hostil (ataca jugadores)','check',true],['color','Color de textura','color','#4ade80'],['tex','Textura PNG propia (64x64, opcional)','tex'],
  ['drop','Suelta al morir (ID de ítem, opcional)','text',''],['dropMin','Cantidad mínima','number',1],['dropMax','Cantidad máxima','number',2],
  ['spawn','Aparece de forma natural','check',false],['weight','Frecuencia de aparición (peso)','number',80],
  ['scale','Escala (tamaño visual)','number',1],['knockback','Resistencia al empuje (0 a 1)','number',0],['followRange','Rango de persecución (0 = normal)','number',0],
  ['burnsDay','Se quema con el sol','check',false],['climb','Puede trepar paredes','check',false],EXTRA],
  o=>`${o.id} · ❤${o.health}`);
crud('items','🎒 Ítems','Ítems','Objetos con textura, durabilidad, daño o comida.',[
  ['id','ID','text','rubi'],['name','Nombre visible','text','Rubí'],['color','Color de textura','color','#ef4444'],['tex','Textura PNG propia (16x16, opcional)','tex'],
  ['stack','Máx. por stack','number',64],['damage','Daño como arma (0 = no)','number',0],['durability','Durabilidad (0 = no)','number',0],
  ['food','Comida: hambre que restaura (0 = no)','number',0],['hand','Se sostiene como herramienta','check',false],['glint','Brillo encantado','check',false],['cooldown','Enfriamiento al usar (segundos, 0 = no)','number',0],['fuel','Combustible: segundos que quema (0 = no)','number',0],
  ['category','Pestaña del creativo','select','items',[['items','Ítems'],['equipment','Equipo'],['nature','Naturaleza'],['construction','Construcción']]],EXTRA],
  o=>o.id);
crud('blocks','🧱 Bloques','Bloques','Bloques cúbicos con textura, dureza y luz.',[
  ['id','ID','text','bloque_rubi'],['name','Nombre visible','text','Bloque de Rubí'],['color','Color de textura','color','#dc2626'],['tex','Textura PNG propia (16x16, opcional)','tex'],
  ['hardness','Segundos para romperlo','number',3],['light','Luz emitida (0-15)','number',0],['blast','Resistencia a explosiones','number',30],['friction','Fricción (0 = normal, 0.1 resbala)','number',0],
  ['render','Render','select','opaque',[['opaque','Sólido'],['alpha_test','Con huecos (hojas, vallas)'],['blend','Translúcido (vidrio)']]],['flammable','Inflamable','check',false],EXTRA],
  o=>`${o.id} · dureza ${o.hardness}`);
crud('recipes','⚒️ Recetas','Recetas','Crafteo en mesa de trabajo. Puedes usar tus ítems/bloques (solo el ID) o minecraft:...',[
  ['id','ID','text','receta_bloque_rubi'],['type','Tipo','select','shaped',[['shaped','Con forma'],['shapeless','Sin forma'],['furnace','Horno (1ª línea = ítem de entrada)']]],
  ['pattern','Patrón (solo con forma, hasta 3 líneas de 3 letras)','area','RRR\nRRR\nRRR'],
  ['ingredients','Ingredientes (con forma: LETRA=ítem; sin forma: un ítem por línea)','area','R=rubi'],
  ['result','Resultado (ID)','text','bloque_rubi'],['count','Cantidad','number',1]],
  o=>`${o.id} → ${o.result}`);
const TRG=[['itemUse','el jugador usa un ítem'],['itemUseOn','el jugador usa un ítem sobre un bloque'],['itemHit','golpeas con un ítem en la mano (afecta al golpeado)'],['entityHit','una entidad golpea a otra (afecta al golpeado)'],['entityHurt','una entidad recibe daño (afecta a la dañada)'],['entitySpawn','aparece una entidad'],['blockBreak','el jugador rompe un bloque'],['blockPlace','el jugador coloca un bloque'],['entityDie','muere una entidad (afecta a quien la mató)'],['playerJoin','un jugador entra al mundo'],['interval','cada X segundos (a todos los jugadores)']];
crud('rules','⚡ Comportamientos','Comportamientos (reglas)','Cuando pasa algo → ocurren varias acciones. Genera scripts/rules.js.',[
  ['name','Nombre','text','Mi comportamiento'],['trigger','Cuando…','select','itemUse',TRG],
  ['target','Filtro: ID del ítem/entidad/bloque (vacío = cualquiera)','text',''],
  ['cond','Condición JavaScript (opcional). Ej: e.isSneaking','text',''],
  ['acciones','Acciones (una por línea)','area','mensaje: ¡Hola!','mensaje: ¡Hola!\nefecto: speed 5 1'],
  ['ox','Desplazamiento X (estructura/invocar)','number',0],['oy','Desplazamiento Y (arriba/abajo)','number',0],['oz','Desplazamiento Z','number',0],
  ['rot','Rotación de la estructura','select','0_degrees',[['0_degrees','0°'],['90_degrees','90°'],['180_degrees','180°'],['270_degrees','270°']]],
  ['seconds','Intervalo en segundos (solo "cada X segundos")','number',5],['chance','Probabilidad (%)','number',100]],
  o=>`${o.trigger} · ${(o.acciones||'').split('\n').filter(Boolean).length} acciones`,{noId:true,help:`<div class="card"><b>📍 ¿Dónde aparece la estructura?</b>
  <p class="muted">En la <b>posición de quien recibe la acción</b> (el jugador, o la entidad golpeada). Muévela con los campos <b>Desplazamiento X/Y/Z</b> de arriba (X = este/oeste, Y = altura, Z = norte/sur). Para una acción concreta puedes escribirlo en la línea: <code>estructura: casa 5 0 -3</code> (coordenadas relativas) o <code>estructura: casa ~5 ~ ~-3 90_degrees</code>.</p>
  <b>Acciones disponibles</b><p class="muted">mensaje: texto · comando: say hola · efecto: poison 5 1 (nombre, segundos, nivel) · invocar: zombie 3 · estructura: casa · sonido: random.levelup · rayo: · explosion: 3 · curar: 4 · dañar: 2 · fuego: 5 · etiqueta: vip · titulo: Hola · tp: ~ ~10 ~ · esperar: 3 (las acciones siguientes se retrasan) · js: e.setOnFire(3)</p>
  <p class="muted">En condiciones y líneas "js:" puedes usar <code>e</code> (a quien afecta) y <code>ev</code> (el evento).</p></div>`});
const SCR0='import { world, system } from "@minecraft/server";\n\nworld.afterEvents.playerSpawn.subscribe(ev => {\n  if (ev.initialSpawn) ev.player.sendMessage("¡Hola desde mi script!");\n});\n';
crud('scripts','📜 Scripts JS','Scripts JavaScript','Programa directamente con la API @minecraft/server (JavaScript es el lenguaje de scripts de Bedrock). Cada script se exporta a scripts/ID.js y se carga solo.',[
  ['id','Nombre del archivo (ID)','text','mi_script'],['code','Código JavaScript','area',SCR0]],o=>`${(o.code||'').split('\n').length} líneas`);
crud('files','📄 Archivos','Archivos personalizados','Máxima libertad: crea cualquier archivo del pack escribiendo su ruta (empieza con BP/ o RP/) y su contenido.',[
  ['name','Ruta, ej: BP/loot_tables/cofre.json','text','BP/'],['content','Contenido','area','{}']],o=>`${(o.content||'').length} caracteres`,{noId:true});

/* Estructuras (editor de voxels -> .mcstructure) */
const BLK=['stone','cobblestone','oak_planks','bricks','glass','dirt','grass_block','sand','obsidian','glowstone','iron_block','gold_block','diamond_block','torch','chest','lava'];
const sp=addTab('structures','🏠 Estructuras',`<h2>Estructuras</h2><p class="muted">Dibuja capa por capa. Se exporta como estructura real (.mcstructure) y la cargas con un Comportamiento (acción "colocar estructura").</p>
  <div id="st_list"></div>
  <div class="card"><b>Crear / cambiar tamaño</b><label>ID<input id="st_id" value="casa"></label>
  <div class="row3"><label>X<input id="st_x" type="number" min="1" max="32" value="7"></label><label>Y (alto)<input id="st_y" type="number" min="1" max="32" value="5"></label><label>Z<input id="st_z" type="number" min="1" max="32" value="7"></label></div>
  <p id="st_e" class="err"></p><button id="st_go" class="primary">Crear / aplicar</button></div>
  <div class="card" id="st_ed" style="display:none"><b id="st_t"></b>
  <label>Capa (alto): <span id="st_ln"></span><input id="st_layer" type="range" min="0" max="0" value="0"></label>
  <canvas id="st_cv"></canvas><div id="st_pal"></div>
  <div class="row"><input id="st_new" list="st_dl" placeholder="bloque, ej: stone o miaddon:bloque_rubi"><button id="st_add">Añadir al paleta</button></div>
  <datalist id="st_dl">${BLK.map(b=>`<option value="${b}">`).join('')}</datalist>
  <button id="st_fill" class="secondary">Rellenar capa</button> <button id="st_clr" class="secondary">Vaciar capa</button> <button id="st_ring" class="secondary">Contorno de capa</button> <button id="st_copy" class="secondary">Copiar capa ↑</button> <button id="st_del" class="danger">Borrar estructura</button></div>`);
const SE={sel:-1,y:0,brush:1,down:false};
const cur=()=>S.structures[SE.sel], ix=(s,x,y,z)=>(x*s.sy+y)*s.sz+z;
const bcol=id=>id==='minecraft:air'?'':`hsl(${Math.abs([...id].reduce((a,c)=>(a*31+c.charCodeAt(0))|0,7))%360},55%,50%)`;
function resizeS(s,nx,ny,nz){const c=Array(nx*ny*nz).fill(0);
  for(let x=0;x<Math.min(s.sx,nx);x++)for(let y=0;y<Math.min(s.sy,ny);y++)for(let z=0;z<Math.min(s.sz,nz);z++)c[(x*ny+y)*nz+z]=s.cells[ix(s,x,y,z)];
  s.sx=nx;s.sy=ny;s.sz=nz;s.cells=c}
function drawS(){const s=cur();if(!s)return;const cv=$('#st_cv'),cs=Math.floor(Math.min(32,330/Math.max(s.sx,s.sz)));
  cv.width=s.sx*cs;cv.height=s.sz*cs;const g=cv.getContext('2d');g.fillStyle='#0b1220';g.fillRect(0,0,cv.width,cv.height);
  for(let x=0;x<s.sx;x++)for(let z=0;z<s.sz;z++){const id=s.pal[s.cells[ix(s,x,SE.y,z)]],c=bcol(id);
    if(c){g.fillStyle=c;g.fillRect(x*cs,z*cs,cs,cs)}g.strokeStyle='#263244';g.strokeRect(x*cs+.5,z*cs+.5,cs,cs)}}
function paintS(e){const s=cur(),cv=$('#st_cv'),r=cv.getBoundingClientRect(),cs=cv.width/s.sx;
  const x=Math.floor((e.clientX-r.left)*(cv.width/r.width)/cs),z=Math.floor((e.clientY-r.top)*(cv.height/r.height)/cs);
  if(x<0||z<0||x>=s.sx||z>=s.sz)return;s.cells[ix(s,x,SE.y,z)]=SE.brush;drawS()}
function renderS(){
  $('#st_list').innerHTML=S.structures.map((s,i)=>`<div class="ent"><span><b>${esc(s.id)}</b> <small>${s.sx}×${s.sy}×${s.sz}</small></span><button data-s="${i}">Editar</button></div>`).join('')||'<p class="muted">Aún no hay estructuras.</p>';
  $$('#st_list [data-s]').forEach(b=>b.onclick=()=>{SE.sel=+b.dataset.s;SE.y=0;SE.brush=1;renderS();$('#st_ed').scrollIntoView()});
  const s=cur();$('#st_ed').style.display=s?'block':'none';if(!s)return;
  $('#st_t').textContent=`Editando: ${s.id} (${s.sx}×${s.sy}×${s.sz})`;
  const l=$('#st_layer');l.max=s.sy-1;l.value=SE.y;$('#st_ln').textContent=`${SE.y+1} de ${s.sy}`;
  $('#st_pal').innerHTML=s.pal.map((id,i)=>`<button class="chip ${i===SE.brush?'on':''}" data-p="${i}" style="border-color:${bcol(id)||'#64748b'}">${i?'■ ':'✕ '}${esc(id.replace('minecraft:',''))}</button>`).join('');
  $$('#st_pal [data-p]').forEach(b=>b.onclick=()=>{SE.brush=+b.dataset.p;renderS()});drawS()}
R.push(renderS);
$('#st_go').onclick=()=>{const id=slug($('#st_id').value),n=['x','y','z'].map(k=>Math.max(1,Math.min(32,+$('#st_'+k).value||1)));
  if(!/^[a-z][a-z0-9_]*$/.test(id))return $('#st_e').textContent='ID inválido (minúsculas, números y _).';$('#st_e').textContent='';
  let i=S.structures.findIndex(s=>s.id===id);
  if(i<0){S.structures.push({id,sx:n[0],sy:n[1],sz:n[2],pal:['minecraft:air','minecraft:stone'],cells:Array(n[0]*n[1]*n[2]).fill(0)});i=S.structures.length-1}
  else resizeS(S.structures[i],...n);
  SE.sel=i;SE.y=0;SE.brush=1;renderAll()};
$('#st_layer').oninput=e=>{SE.y=+e.target.value;renderS()};
$('#st_add').onclick=()=>{const s=cur(),id=full($('#st_new').value);if(!id)return;if(!s.pal.includes(id))s.pal.push(id);SE.brush=s.pal.indexOf(id);$('#st_new').value='';renderAll()};
const layerSet=v=>{const s=cur();for(let x=0;x<s.sx;x++)for(let z=0;z<s.sz;z++)s.cells[ix(s,x,SE.y,z)]=v;renderAll()};
$('#st_ring').onclick=()=>{const s=cur();for(let x=0;x<s.sx;x++)for(let z=0;z<s.sz;z++)if(x==0||z==0||x==s.sx-1||z==s.sz-1)s.cells[ix(s,x,SE.y,z)]=SE.brush;renderAll()};
$('#st_copy').onclick=()=>{const s=cur();if(SE.y>=s.sy-1)return;for(let x=0;x<s.sx;x++)for(let z=0;z<s.sz;z++)s.cells[ix(s,x,SE.y+1,z)]=s.cells[ix(s,x,SE.y,z)];SE.y++;renderAll()};
$('#st_fill').onclick=()=>layerSet(SE.brush);$('#st_clr').onclick=()=>layerSet(0);
$('#st_del').onclick=()=>{S.structures.splice(SE.sel,1);SE.sel=-1;renderAll()};
const cv=$('#st_cv');cv.style.touchAction='none';
cv.onpointerdown=e=>{SE.down=true;cv.setPointerCapture(e.pointerId);paintS(e)};
cv.onpointermove=e=>{if(SE.down)paintS(e)};cv.onpointerup=()=>{SE.down=false;persist()};

/* Validador + archivos generados */
addTab('validator','🔍 Validador',`<h2>Validador</h2><button id="vGo" class="primary">Validar proyecto</button><div id="vOut"></div>
  <h3>Archivos generados</h3><select id="vSel"></select><pre id="vFile" class="code" style="display:block"></pre>`);
let VF=[];
$('#vGo').onclick=()=>{const r=validate();$('#vOut').innerHTML=r.map(([t,m])=>`<div class="ent ${t}">${t==='err'?'❌':t==='warn'?'⚠️':'✅'} ${esc(m)}</div>`).join('');
  const b=build();VF=[...b.bp.map(f=>({n:'BP/'+f.name,d:f.data})),...b.rp.map(f=>({n:'RP/'+f.name,d:f.data}))];
  $('#vSel').innerHTML=VF.map((f,i)=>`<option value="${i}">${esc(f.n)}</option>`).join('');showF()};
const showF=()=>{const f=VF[$('#vSel').value];$('#vFile').textContent=f?(typeof f.d==='string'?f.d:`[archivo binario, ${f.d.length} bytes]`):''};
$('#vSel').onchange=showF;

/* Exportar */
$('#exportBtn').onclick=()=>{
  const errs=validate().filter(x=>x[0]==='err');
  if(errs.length&&!confirm(`Hay ${errs.length} error(es):\n- ${errs.slice(0,4).map(x=>x[1]).join('\n- ')}\n\n¿Exportar de todos modos?`))return;
  const b=build(),root=slug(S.settings.name).replace(/_/g,'-')||'addon';
  download(zip([{name:`${root}_BP.mcpack`,data:zip(b.bp)},{name:`${root}_RP.mcpack`,data:zip(b.rp)}]),`${root}.mcaddon`);
  toast(`¡${root}.mcaddon listo!`)};

/* Inicio */
try{const s=JSON.parse(localStorage.getItem('mcpe_editor_v03')||'null');if(s)loadState(s);else{
  const o=JSON.parse(localStorage.getItem('mcpe_editor_v02')||'null');
  if(o){const f=o.form||{};Object.keys(SET0).forEach(k=>{if(f[k])S.settings[k]=f[k]});
    S.entities=(o.entities||[]).map(e=>({width:.6,height:1.9,drop:'',dropMin:1,dropMax:2,spawn:false,weight:80,extra:'',tex:'',...e}))}}}catch(e){}
$$('.tab')[0].click();
