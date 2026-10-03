/* Estado + generadores de archivos */
const SET0={name:'Mi Add-On',description:'Add-On creado con MCPE Mod Editor.',author:'Irving',version:'1.0.0',namespace:'miaddon',minEngine:'1.21.0',serverApi:'2.0.0'};
const S={settings:{...SET0},entities:[],items:[],blocks:[],recipes:[],rules:[],structures:[],scripts:[],files:[]};
const NS=()=>slug(S.settings.namespace)||'miaddon';
const mineIds=()=>[...S.items,...S.blocks,...S.entities].map(o=>o.id);
function full(id){id=(id||'').trim();if(!id)return '';if(id.includes(':'))return id;return mineIds().includes(id)?`${NS()}:${id}`:'minecraft:'+id}
const J=o=>JSON.stringify(o,null,2);
const parseExtra=t=>{try{const v=JSON.parse(t||'{}');return v&&typeof v==='object'?v:{}}catch{return null}};

function genEntity(e){
  const c={'minecraft:type_family':{family:[e.hostile?'monster':'mob']},'minecraft:health':{value:e.health,max:e.health},
    'minecraft:movement':{value:e.speed},'minecraft:navigation.walk':{can_path_over_water:false,avoid_water:true},
    'minecraft:movement.basic':{},'minecraft:jump.static':{},'minecraft:collision_box':{width:e.width,height:e.height},
    'minecraft:physics':{},'minecraft:pushable':{is_pushable:true,is_pushable_by_piston:true},
    'minecraft:behavior.random_stroll':{priority:6,speed_multiplier:1},'minecraft:behavior.look_at_player':{priority:7,look_distance:6},
    'minecraft:behavior.random_look_around':{priority:8}};
  if(e.hostile){c['minecraft:attack']={damage:e.damage};
    c['minecraft:behavior.melee_attack']={priority:3,speed_multiplier:1.2,track_target:true};
    c['minecraft:behavior.nearest_attackable_target']={priority:2,entity_types:[{filters:{test:'is_family',subject:'other',value:'player'},max_dist:16}],must_see:true}}
  if(e.scale&&e.scale!=1)c['minecraft:scale']={value:e.scale};
  if(e.knockback)c['minecraft:knockback_resistance']={value:e.knockback};
  if(e.followRange)c['minecraft:follow_range']={value:e.followRange,max:e.followRange};
  if(e.burnsDay)c['minecraft:burns_in_daylight']={};
  if(e.climb)c['minecraft:can_climb']={};
  if(e.drop)c['minecraft:loot']={table:`loot_tables/entities/${e.id}.json`};
  Object.assign(c,parseExtra(e.extra)||{});
  return J({format_version:'1.21.0','minecraft:entity':{description:{identifier:`${NS()}:${e.id}`,is_spawnable:true,is_summonable:true},components:c}});
}
const genClient=e=>J({format_version:'1.10.0','minecraft:client_entity':{description:{identifier:`${NS()}:${e.id}`,materials:{default:'entity_alpha'},
  textures:{default:`textures/entity/${NS()}/${e.id}`},geometry:{default:'geometry.humanoid.custom'},render_controllers:['controller.render.default'],
  spawn_egg:{base_color:e.color,overlay_color:'#222222'}}}});
const genLoot=e=>J({pools:[{rolls:1,entries:[{type:'item',name:full(e.drop),weight:1,functions:[{function:'set_count',count:{min:e.dropMin,max:Math.max(e.dropMin,e.dropMax)}}]}]}]});
const genSpawn=e=>J({format_version:'1.8.0','minecraft:spawn_rules':{description:{identifier:`${NS()}:${e.id}`,population_control:e.hostile?'monster':'animal'},
  conditions:[Object.assign({'minecraft:spawns_on_surface':{},'minecraft:weight':{default:e.weight},'minecraft:herd':{min_size:1,max_size:3},
    'minecraft:biome_filter':{test:'has_biome_tag',operator:'==',value:'overworld'}},e.hostile?{'minecraft:brightness_filter':{min:0,max:7,adjust_for_weather:false}}:{})]}});

function genItem(i){
  const c={'minecraft:icon':{textures:{default:i.id}},'minecraft:max_stack_size':i.stack};
  if(i.hand)c['minecraft:hand_equipped']=true;
  if(i.glint)c['minecraft:glint']=true;
  if(i.cooldown>0)c['minecraft:cooldown']={category:i.id,duration:i.cooldown};
  if(i.fuel>0)c['minecraft:fuel']={duration:i.fuel};
  if(i.damage>0)c['minecraft:damage']=i.damage;
  if(i.durability>0)c['minecraft:durability']={max_durability:i.durability};
  if(i.food>0){c['minecraft:food']={nutrition:i.food,saturation_modifier:'normal',can_always_eat:false};c['minecraft:use_modifiers']={use_duration:1.6,movement_modifier:0.35}}
  Object.assign(c,parseExtra(i.extra)||{});
  return J({format_version:'1.21.20','minecraft:item':{description:{identifier:`${NS()}:${i.id}`,menu_category:{category:i.category||'items'}},components:c}});
}
function genBlock(b){
  const c={'minecraft:geometry':'minecraft:geometry.full_block','minecraft:material_instances':{'*':{texture:b.id,render_method:b.render||'opaque'}},
    'minecraft:destructible_by_mining':{seconds_to_destroy:b.hardness}};
  if(b.friction>0)c['minecraft:friction']=b.friction;
  if(b.blast>=0)c['minecraft:destructible_by_explosion']={explosion_resistance:b.blast};
  if(b.flammable)c['minecraft:flammable']={catch_chance_modifier:5,destroy_chance_modifier:20};
  if(b.light>0)c['minecraft:light_emission']=Math.min(15,b.light);
  Object.assign(c,parseExtra(b.extra)||{});
  return J({format_version:'1.21.20','minecraft:block':{description:{identifier:`${NS()}:${b.id}`,menu_category:{category:'construction'}},components:c}});
}
function genRecipe(r){
  const lines=(r.ingredients||'').split('\n').map(x=>x.trim()).filter(Boolean),result={item:full(r.result),count:r.count},id=`${NS()}:${r.id}`;
  if(r.type==='furnace')return J({format_version:'1.20.10','minecraft:recipe_furnace':{description:{identifier:id},tags:['furnace'],input:full(lines[0]||''),output:full(r.result)}});
  if(r.type==='shapeless')return J({format_version:'1.20.10','minecraft:recipe_shapeless':{description:{identifier:id},tags:['crafting_table'],ingredients:lines.map(l=>({item:full(l.split('=').pop())})),result}});
  const key={};lines.forEach(l=>{const [k,v]=l.split('=');if(k&&v)key[k.trim()]={item:full(v)}});
  return J({format_version:'1.20.10','minecraft:recipe_shaped':{description:{identifier:id},tags:['crafting_table'],pattern:(r.pattern||'').split('\n').map(x=>x.replace(/\r/g,'')).filter(x=>x.length),key,result}});
}

/* Comportamientos -> scripts/rules.js */
const ACT_KEYS=['mensaje','comando','efecto','invocar','estructura','sonido','rayo','explosion','curar','dañar','fuego','etiqueta','titulo','tp','js','esperar'];
function actionCode(line,r){
  const i=line.indexOf(':');if(i<0)return '';
  const k=line.slice(0,i).trim().toLowerCase(),v=line.slice(i+1).trim(),p=v.split(/\s+/),q=JSON.stringify;
  const n=(x,d)=>x===undefined||x===''||isNaN(+x)?d:+x,off=o=>+o?'~'+(+o):'~',ps=`${off(r.ox)} ${off(r.oy)} ${off(r.oz)}`;
  switch(k){
    case 'mensaje':return `say(e,${q(v)});`;
    case 'comando':return `cmd(e,${q(v.replace(/^\//,''))});`;
    case 'efecto':return `try{e.addEffect(${q(p[0].replace('minecraft:',''))},${Math.round(n(p[1],5)*20)},{amplifier:${n(p[2],0)}});}catch{}`;
    case 'invocar':return `try{const l=e.location;for(let i=0;i<${n(p[1],1)};i++)e.dimension.spawnEntity(${q(full(p[0]))},{x:l.x+${+r.ox||0},y:l.y+${+r.oy||0},z:l.z+${+r.oz||0}});}catch{}`;
    case 'estructura':{const id=p[0].includes(':')?p[0]:NS()+':'+p[0],pos=p.length>=4?p.slice(1,4).join(' '):ps,rot=p[4]||r.rot||'0_degrees';
      return `cmd(e,${q(`structure load ${id} ${pos} ${rot}`)});`}
    case 'sonido':return `cmd(e,${q(`playsound ${v} @a ~ ~ ~`)});`;
    case 'rayo':return `cmd(e,"summon lightning_bolt ~ ~ ~");`;
    case 'explosion':return `try{e.dimension.createExplosion(e.location,${n(p[0],3)},{breaksBlocks:${p[1]!=='no'}});}catch{}`;
    case 'curar':return `try{const h=e.getComponent("minecraft:health");h.setCurrentValue(Math.min(h.effectiveMax,h.currentValue+${n(p[0],4)}));}catch{}`;
    case 'dañar':case 'danar':return `try{e.applyDamage(${n(p[0],1)});}catch{}`;
    case 'fuego':return `try{e.setOnFire(${n(p[0],5)},true);}catch{}`;
    case 'etiqueta':return `try{e.addTag(${q(v)});}catch{}`;
    case 'titulo':return `cmd(e,${q('title @s title '+v)});`;
    case 'tp':return `cmd(e,${q('tp @s '+v)});`;
    case 'js':return `try{${v}}catch(err){}`;
  }return '';
}
const TRIG={
  itemUse:['world.afterEvents.itemUse','const e=ev.source;','ev.itemStack.typeId'],
  itemUseOn:['world.afterEvents.itemUseOn','const e=ev.source;','ev.itemStack.typeId'],
  itemHit:['world.afterEvents.entityHitEntity','const e=ev.hitEntity;','heldId(ev.damagingEntity)'],
  entityHit:['world.afterEvents.entityHitEntity','const e=ev.hitEntity;','ev.damagingEntity.typeId'],
  entityHurt:['world.afterEvents.entityHurt','const e=ev.hurtEntity;','e.typeId'],
  entitySpawn:['world.afterEvents.entitySpawn','const e=ev.entity;','e.typeId'],
  blockBreak:['world.afterEvents.playerBreakBlock','const e=ev.player;','ev.brokenBlockPermutation.type.id'],
  blockPlace:['world.afterEvents.playerPlaceBlock','const e=ev.player;','ev.block.typeId'],
  entityDie:['world.afterEvents.entityDie','const e=ev.damageSource&&ev.damageSource.damagingEntity;if(!e)return;','ev.deadEntity.typeId'],
  playerJoin:['world.afterEvents.playerSpawn','if(!ev.initialSpawn)return;const e=ev.player;',null]};
function genRules(){
  const q=JSON.stringify;
  const body=(r,tgt)=>{
    let delay=0;
    const acts=(r.acciones||'').split('\n').map(x=>x.trim()).filter(x=>x&&!x.startsWith('//')).map(l=>{
      const m=l.match(/^(esperar|wait)\s*:\s*([\d.]+)/i);if(m){delay+=+m[2];return ''}
      const c=actionCode(l,r);return delay>0&&c?`system.runTimeout(()=>{${c}},${Math.round(delay*20)});`:c}).join('');
    const ch=r.chance==null?100:r.chance;
    return (tgt&&r.target?`if(${tgt}!==${q(full(r.target))})return;`:'')+(r.cond?`try{if(!(${r.cond}))return;}catch{return;}`:'')+(ch<100?`if(!rnd(${ch}))return;`:'')+acts};
  const out=S.rules.map(r=>{
    if(r.trigger==='interval')return `// ${r.name}\nsystem.runInterval(()=>{for(const e of world.getAllPlayers()){(()=>{const ev=undefined;${body(r,null)}})();}},${Math.max(1,Math.round((r.seconds||5)*20))});`;
    const t=TRIG[r.trigger];if(!t)return '';
    return `// ${r.name}\n${t[0]}.subscribe(ev=>{${t[1]}${body(r,t[2])}});`}).join('\n\n');
  return `// Generado por MCPE Mod Editor (reglas)\nimport { world, system } from "@minecraft/server";\n
const rnd=p=>Math.random()*100<p;
const say=(e,t)=>{try{e.sendMessage?e.sendMessage(t):world.sendMessage(t)}catch{}};
const cmd=(e,c)=>{try{e.runCommand(c)}catch{}};
const heldId=p=>{try{return p.getComponent("minecraft:inventory").container.getItem(p.selectedSlotIndex)?.typeId}catch{return undefined}};\n\n${out}\n`;
}

/* Construye todos los archivos del Add-On */
function build(){
  const d=S.settings,ns=NS(),u={bp:uuid(),rp:uuid(),bpm:uuid(),rpm:uuid(),sm:uuid()},v=ver(d.version),mods=[];
  const bp=[],rp=[],lang=[],items={},blocks={},bj={};
  const bm={format_version:2,header:{name:d.name+' BP',description:d.description,uuid:u.bp,version:v,min_engine_version:ver(d.minEngine)},
    modules:[{description:d.description,type:'data',uuid:u.bpm,version:v}],dependencies:[{uuid:u.rp,version:v}],metadata:{authors:[d.author]}};
  if(S.rules.length){bp.push({name:'scripts/rules.js',data:genRules()});mods.push('rules')}
  S.scripts.forEach(x=>{bp.push({name:`scripts/${x.id}.js`,data:x.code||''});mods.push(x.id)});
  if(mods.length){bp.push({name:'scripts/main.js',data:mods.map(m=>`import "./${m}.js";`).join('\n')+'\n'});
    bm.modules.push({description:'Scripts',type:'script',language:'javascript',uuid:u.sm,version:v,entry:'scripts/main.js'});
    bm.dependencies.push({module_name:'@minecraft/server',version:d.serverApi})}
  const rm={format_version:2,header:{name:d.name+' RP',description:d.description,uuid:u.rp,version:v,min_engine_version:ver(d.minEngine)},
    modules:[{description:d.description,type:'resources',uuid:u.rpm,version:v}],metadata:{authors:[d.author]}};
  bp.push({name:'manifest.json',data:J(bm)});rp.push({name:'manifest.json',data:J(rm)});
  S.entities.forEach(e=>{bp.push({name:`entities/${e.id}.json`,data:genEntity(e)});rp.push({name:`entity/${e.id}.entity.json`,data:genClient(e)});
    rp.push({name:`textures/entity/${ns}/${e.id}.png`,data:texBytes(e,'entity')});
    if(e.drop)bp.push({name:`loot_tables/entities/${e.id}.json`,data:genLoot(e)});
    if(e.spawn)bp.push({name:`spawn_rules/${e.id}.json`,data:genSpawn(e)});
    lang.push(`entity.${ns}:${e.id}.name=${e.name}`,`item.spawn_egg.entity.${ns}:${e.id}.name=Huevo: ${e.name}`)});
  S.items.forEach(i=>{bp.push({name:`items/${i.id}.json`,data:genItem(i)});rp.push({name:`textures/items/${i.id}.png`,data:texBytes(i,'item')});
    items[i.id]={textures:`textures/items/${i.id}`};lang.push(`item.${ns}:${i.id}=${i.name}`,`item.${ns}:${i.id}.name=${i.name}`)});
  S.blocks.forEach(b=>{bp.push({name:`blocks/${b.id}.json`,data:genBlock(b)});rp.push({name:`textures/blocks/${b.id}.png`,data:texBytes(b,'block')});
    blocks[b.id]={textures:`textures/blocks/${b.id}`};bj[`${ns}:${b.id}`]={sound:'stone'};lang.push(`tile.${ns}:${b.id}.name=${b.name}`)});
  if(S.items.length)rp.push({name:'textures/item_texture.json',data:J({resource_pack_name:ns,texture_name:'atlas.items',texture_data:items})});
  if(S.blocks.length){rp.push({name:'textures/terrain_texture.json',data:J({resource_pack_name:ns,texture_name:'atlas.terrain',padding:8,num_mip_levels:4,texture_data:blocks})});
    rp.push({name:'blocks.json',data:J(Object.assign({format_version:[1,1,0]},bj))})}
  S.recipes.forEach(r=>bp.push({name:`recipes/${r.id}.json`,data:genRecipe(r)}));
  S.structures.forEach(s=>bp.push({name:`structures/${ns}/${s.id}.mcstructure`,data:mcstructure(s)}));
  if(lang.length){rp.push({name:'texts/en_US.lang',data:lang.join('\n')+'\n'});rp.push({name:'texts/languages.json',data:'["en_US"]'})}
  S.files.forEach(f=>{const m=(f.name||'').trim().match(/^(BP|RP)\/(.+)$/i);if(m)(m[1].toUpperCase()==='BP'?bp:rp).push({name:m[2],data:f.content||''})});
  return{bp,rp};
}

/* Validador */
function validate(){
  const out=[],E=m=>out.push(['err',m]),W=m=>out.push(['warn',m]);
  if(!/^[a-z][a-z0-9_]*$/.test(NS()))E('El namespace debe empezar con letra (a-z, 0-9, _).');
  if(NS()==='minecraft')E('El namespace no puede ser "minecraft".');
  ['entities','items','blocks','recipes','structures','rules'].forEach(k=>{const seen={};S[k].forEach(o=>{
    if(k!=='rules'){if(!/^[a-z][a-z0-9_]*$/.test(o.id))E(`${k}: ID inválido "${o.id}".`);if(seen[o.id])E(`${k}: ID repetido "${o.id}".`);seen[o.id]=1}
    if(o.extra&&parseExtra(o.extra)===null)E(`${k}/${o.id||o.name}: el JSON avanzado no es válido.`)})});
  S.recipes.forEach(r=>{
    const rows=(r.pattern||'').split('\n').filter(x=>x.length);
    if(r.type==='shaped'){if(!rows.length||rows.length>3||rows.some(x=>x.length>3))E(`Receta ${r.id}: el patrón debe ser de máx. 3x3.`);
      const keys=(r.ingredients||'').split('\n').map(l=>l.split('=')[0].trim()).filter(Boolean);
      new Set(rows.join('').replace(/ /g,'').split('')).forEach(ch=>{if(!keys.includes(ch))E(`Receta ${r.id}: falta definir "${ch}" en los ingredientes.`)})}
    if(!r.result)E(`Receta ${r.id}: falta el resultado.`)});
  const syn=(code,label)=>{try{new Function(code.replace(/^\s*import[^\n]*$/gm,''))}catch(err){E(`${label}: error de sintaxis → ${err.message}`)}};
  S.rules.forEach(r=>{(r.acciones||'').split('\n').map(x=>x.trim()).filter(x=>x&&!x.startsWith('//')).forEach(l=>{
    const k=l.split(':')[0].trim().toLowerCase();if(!ACT_KEYS.includes(k)&&k!=='wait'&&k!=='danar')W(`Comportamiento "${r.name}": acción desconocida "${k}".`);
    if(k==='estructura'){const id=l.slice(l.indexOf(':')+1).trim().split(/\s+/)[0].replace(NS()+':','');if(!S.structures.some(s=>s.id===id))E(`Comportamiento "${r.name}": la estructura "${id}" no existe.`)}});
    if(!(r.acciones||'').trim())W(`Comportamiento "${r.name}": no tiene acciones.`)});
  if(S.rules.length)syn(genRules(),'Reglas generadas (revisa condiciones y líneas "js:")');
  S.scripts.forEach(x=>syn(x.code||'',`Script ${x.id}`));
  S.files.forEach(f=>{if(!/^(BP|RP)\//i.test((f.name||'').trim()))E(`Archivo "${f.name}": debe empezar con BP/ o RP/.`);
    else if(/\.json$/i.test(f.name)){try{JSON.parse(f.content||'')}catch{E(`Archivo "${f.name}": JSON inválido.`)}}});
  S.structures.forEach(s=>{if(!s.cells.some(c=>c>0))W(`Estructura ${s.id}: está vacía (solo aire).`)});
  S.entities.forEach(e=>{if(e.drop&&!e.dropMax)W(`Entidad ${e.id}: cantidad máxima de drop = 0.`)});
  if(!out.length)out.push(['ok','Todo se ve bien. ¡Listo para exportar!']);
  return out;
}
