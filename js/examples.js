/* Ejemplos que se cargan de verdad en el proyecto */
const put=(k,o)=>{const i=S[k].findIndex(x=>(k==='rules'||k==='files')?x.name===o.name:x.id===o.id);i>=0?S[k][i]=o:S[k].push(o)};
const mk=(d,o)=>({...d,...o});
const ITEM=o=>mk({name:'',color:'#ef4444',tex:'',stack:64,damage:0,durability:0,food:0,hand:false,glint:false,cooldown:0,fuel:0,category:'items',extra:''},o);
const ENT=o=>mk({health:20,speed:.3,damage:3,width:.6,height:1.9,hostile:true,color:'#4ade80',tex:'',drop:'',dropMin:1,dropMax:2,spawn:false,weight:80,scale:1,knockback:0,followRange:0,burnsDay:false,climb:false,extra:''},o);
const BLOQ=o=>mk({color:'#dc2626',tex:'',hardness:3,light:0,blast:30,friction:0,render:'opaque',flammable:false,extra:''},o);
const RUL=o=>mk({trigger:'itemUse',target:'',cond:'',acciones:'',ox:0,oy:0,oz:0,rot:'0_degrees',seconds:5,chance:100},o);
const RUBI=()=>put('items',ITEM({id:'rubi',name:'Rubí',color:'#ef4444'}));
function casa(){const sx=7,sy=5,sz=7,c=Array(sx*sy*sz).fill(0);
  for(let x=0;x<sx;x++)for(let y=0;y<sy;y++)for(let z=0;z<sz;z++){const edge=x==0||x==sx-1||z==0||z==sz-1;let v=0;
    if(y==0)v=1;else if(y==sy-1)v=4;else if(edge){v=2;if(y==2&&((x%6==0&&z>=2&&z<=4)||(z%6==0&&x>=2&&x<=4)))v=3;if(x==3&&z==0)v=0}
    c[(x*sy+y)*sz+z]=v}
  return{id:'casa',sx,sy,sz,pal:['minecraft:air','minecraft:cobblestone','minecraft:oak_planks','minecraft:glass','minecraft:stone_bricks'],cells:c}}
const EXS=[
 ['💎 Rubí que construye una casa','Ítem "rubi" + estructura "casa" (7×5×7). Al usar el rubí aparece la casa 2 bloques al lado. Tip: /give @s NS:rubi',()=>{RUBI();put('structures',casa());
   put('rules',RUL({name:'Rubí construye casa',trigger:'itemUse',target:'rubi',acciones:'mensaje: §a¡Casa construida!\nestructura: casa\nsonido: random.levelup',ox:2,oz:2}))}],
 ['🧟 Zombie venenoso','Mob hostil que se quema con el sol, suelta carne y envenena al jugador que golpea. Aparece de forma natural.',()=>{
   put('entities',ENT({id:'zombie_veneno',name:'Zombie Venenoso',health:30,speed:.3,damage:3,burnsDay:true,drop:'rotten_flesh',dropMin:1,dropMax:3,spawn:true,weight:60}));
   put('rules',RUL({name:'Zombie envenena',trigger:'entityHit',target:'zombie_veneno',cond:"e.typeId==='minecraft:player'",acciones:'efecto: poison 6 1\nmensaje: §2¡Te envenenaron!'}))}],
 ['🧱 Bloque de rubí + receta','Ítem rubi, bloque "bloque_rubi" que brilla y receta 3×3 para fabricarlo.',()=>{RUBI();
   put('blocks',BLOQ({id:'bloque_rubi',name:'Bloque de Rubí',light:7,hardness:4}));
   put('recipes',{id:'receta_bloque_rubi',type:'shaped',pattern:'RRR\nRRR\nRRR',ingredients:'R=rubi',result:'bloque_rubi',count:1})}],
 ['⚡ Espada del rayo','Espada con brillo: al golpear (40%) cae un rayo y el enemigo se ralentiza.',()=>{
   put('items',ITEM({id:'espada_rayo',name:'Espada del Rayo',color:'#60a5fa',damage:8,durability:500,hand:true,glint:true,cooldown:1,category:'equipment'}));
   put('rules',RUL({name:'Espada lanza rayos',trigger:'itemHit',target:'espada_rayo',acciones:'rayo:\nefecto: slowness 3 1',chance:40}))}],
 ['💚 Curación al agacharte','Cada 10 s, los jugadores agachados se curan. Usa condición JavaScript.',()=>{
   put('rules',RUL({name:'Curación agachado',trigger:'interval',seconds:10,cond:'e.isSneaking',acciones:'curar: 4\ntitulo: §aTe sientes mejor'}))}],
 ['📜 Script JS: diamante extra','Código JavaScript puro: al romper mena de diamante suelta un diamante extra y avisa.',()=>{
   put('scripts',{id:'diamante_extra',code:`import { world, ItemStack } from "@minecraft/server";

world.afterEvents.playerBreakBlock.subscribe(ev => {
  if (ev.brokenBlockPermutation.type.id !== "minecraft:diamond_ore") return;
  ev.dimension.spawnItem(new ItemStack("minecraft:diamond", 1), ev.block.location);
  ev.player.sendMessage("§b¡Bonus de diamante!");
});
`})}]];
const ep=addTab('examples','🧪 Ejemplos',`<h2>Ejemplos</h2><p class="muted">Pulsa "Cargar" y el ejemplo se añade al proyecto (puedes editarlo en cada pestaña). El namespace actual es <b id="exNs"></b>.</p>
  ${EXS.map((e,i)=>`<div class="card"><b>${e[0]}</b><p class="muted">${e[1]}</p><button class="primary" data-x="${i}">Cargar en el proyecto</button></div>`).join('')}`);
$('#tabs').insertBefore($('[data-tab=examples]'),$('#tabs').children[1]);
R.push(()=>$('#exNs').textContent=NS());
$$('[data-x]').forEach(b=>b.onclick=()=>{EXS[+b.dataset.x][2]();renderAll();toast('Ejemplo cargado')});
