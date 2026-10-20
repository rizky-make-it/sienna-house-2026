import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const P=(x,y,z)=>new THREE.Vector3(x,z,-y);
const roomNames={master:'Master bedroom',guest:'Guest & reading',living:'Living room',dining:'Dining room',hall:'Gallery hall'};
const keys=new Set(),roots=[],parts=[],animations=[];
let renderer,scene,camera,orbit,house,ceiling,inspection,inspectionSku,ground,loader,sceneInfo,products,selected,currentRoom='master',mode='walk',ready=false,loading=false,lastTime=0,yaw=0,pitch=0,visible=true,selectionSku;
let pointer=null,dragging=false,rafId,frameCount=0,uiTick=0,needsRender=true;
const canvas=$('#canvas'),viewer=$('#viewer'),ray=new THREE.Raycaster(),pointerNDC=new THREE.Vector2();
const emit=(name,detail)=>document.dispatchEvent(new CustomEvent(name,{detail}));
const note=text=>emit('tour:notice',text);
function showControls(){for(const id of ['viewer-tools','viewer-bottom','walk-pad'])$('#'+id).hidden=false;$('#load-screen').hidden=true;}
function resize(){if(!renderer)return;const w=viewer.clientWidth,h=viewer.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();needsRender=true;}
function lookAt(target){camera.lookAt(target);const e=new THREE.Euler().setFromQuaternion(camera.quaternion,'YXZ');yaw=e.y;pitch=e.x;}
function setPressed(){
  $('#walk-mode').setAttribute('aria-pressed',mode==='walk');$('#orbit-mode').setAttribute('aria-pressed',mode==='orbit');
  $('#walk-pad').hidden=mode!=='walk';$('#back-house').hidden=mode!=='product';$('#walk-mode').hidden=mode==='product';$('#orbit-mode').hidden=mode==='product';
  $('#view-hint').textContent=mode==='walk'?'GESER UNTUK MELIHAT · WASD UNTUK BERJALAN':mode==='product'?'GESER UNTUK ORBIT · SCROLL / CUBIT UNTUK ZOOM':'GESER UNTUK ORBIT · SCROLL / CUBIT UNTUK ZOOM';
}
function closeSelection(){selected=null;selectionSku=null;$('#selection').hidden=true;}
function disposeModel(root){const geometries=new Set(),materials=new Set(),textures=new Set();root.traverse(o=>{if(o.isMesh){geometries.add(o.geometry);for(const m of(Array.isArray(o.material)?o.material:[o.material]))if(m){materials.add(m);for(const value of Object.values(m))if(value?.isTexture)textures.add(value);}}});for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures){t.dispose();t.image?.close?.();}}
function clearInspection(){if(inspection){for(let i=animations.length-1;i>=0;i--){let part=animations[i].part;while(part&&part!==inspection)part=part.parent;if(part===inspection)animations.splice(i,1);}scene.remove(inspection);disposeModel(inspection);inspection=null;inspectionSku=null;}if(house)house.visible=true;if(ground)ground.visible=false;}
export function goRoom(id,boot=false){
  if(!boot)inspect.latest=Symbol('room-navigation');
  currentRoom=id;$$('[data-room]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.room===id));$('#view-label').textContent=roomNames[id];
  if(!ready)return;
  clearInspection();ceiling.visible=true;mode='walk';orbit.enabled=false;camera.fov=55;camera.near=.07;camera.updateProjectionMatrix();
  const r=sceneInfo.rooms[id],coords=r.camera;
  const loc=coords?coords[0]:[4.9,5.3,1.65];const target=coords?coords[1]:[7,5.3,1.65];
  camera.position.copy(P(...loc));lookAt(P(target[0],target[1],1.4));closeSelection();setPressed();keys.clear();needsRender=true;
}
function overview(){
  inspect.latest=Symbol('overview-navigation');
  clearInspection();ceiling.visible=false;mode='orbit';orbit.enabled=true;camera.fov=48;camera.updateProjectionMatrix();
  camera.position.set(17,16,7);orbit.target.set(6,.3,-5.25);orbit.minDistance=3;orbit.maxDistance=30;orbit.maxPolarAngle=Math.PI*.48;orbit.update();
  $('#view-label').textContent='The connected house';closeSelection();setPressed();keys.clear();needsRender=true;
}
function findRoot(obj){while(obj){if(obj.userData.kind==='product')return obj;obj=obj.parent;}return null;}
function movingParts(root){const list=[];root.traverse(o=>{if(o.userData.kind==='articulation')list.push(o);});return list;}
function selectProduct(root){
  if(!root)return;selected=root;selectionSku=root.userData.product_id;const product=products.find(p=>p.sku===selectionSku);if(!product)return;
  $('#selected-sku').textContent=product.sku+' / WARM BROWN';$('#selected-name').textContent=product.name;
  $('#selected-dimensions').textContent=product.dimensions.join(' × ')+' mm · lebar × kedalaman × tinggi';
  $('#selection').hidden=false;$('#inspect-product').hidden=mode==='product';
  const moving=movingParts(root);$('#open-parts').hidden=!moving.length;$('#open-parts').textContent=moving.some(p=>p.userData.open)?'Tutup laci / pintu':'Buka laci / pintu';
  $('#open-parts').setAttribute('aria-pressed',String(moving.some(p=>p.userData.open)));
  $('#download-product').dataset.downloadRequest='model GLB '+product.name+' ('+product.sku+')';emit('tour:selection',product);
}
function setupPart(part){
  if(part.userData.basePosition)return;
  part.userData.basePosition=part.position.clone();part.userData.baseQuaternion=part.quaternion.clone();part.userData.open=false;
}
export function toggleParts(){
  if(!selected)return;const list=movingParts(selected);const shouldOpen=!list.some(p=>p.userData.open);
  for(const part of list){setupPart(part);const startPosition=part.position.clone(),startQuaternion=part.quaternion.clone(),targetPosition=part.userData.basePosition.clone(),targetQuaternion=part.userData.baseQuaternion.clone();
    for(let i=animations.length-1;i>=0;i--)if(animations[i].part===part)animations.splice(i,1);
    if(shouldOpen){if(part.userData.action==='drawer')targetPosition.z+=Number(part.userData.distance)||.20;else targetQuaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Number(part.userData.angle)||1.5));}
    animations.push({part,startPosition,startQuaternion,targetPosition,targetQuaternion,start:performance.now(),duration:650});part.userData.open=shouldOpen;
  }
  $('#open-parts').textContent=shouldOpen?'Tutup laci / pintu':'Buka laci / pintu';$('#open-parts').setAttribute('aria-pressed',String(shouldOpen));
}
export async function inspect(sku){
  const requestId=Symbol();inspect.latest=requestId;
  if(!ready){await start();if(!ready||inspect.latest!==requestId)return;}
  const product=products.find(p=>p.sku===sku);if(!product)return;
  note('Memuat '+product.name+'…');
  try{
    const gltf=await loader.loadAsync(product.model);if(inspect.latest!==requestId){disposeModel(gltf.scene);return;}
    clearInspection();inspection=gltf.scene;inspectionSku=sku;scene.add(inspection);house.visible=false;ceiling.visible=false;ground.visible=true;mode='product';orbit.enabled=true;keys.clear();
    inspection.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}if(o.userData.kind==='articulation')setupPart(o);});
    const box=new THREE.Box3().setFromObject(inspection),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
    ground.position.set(center.x,box.min.y-.008,center.z);ground.scale.setScalar(Math.max(3,size.length()*1.2));
    const distance=size.length()*1.15*Math.max(1,.88/camera.aspect);camera.fov=40;camera.updateProjectionMatrix();camera.position.copy(center).add(new THREE.Vector3(distance*.85,distance*.55,distance));
    orbit.target.copy(center);orbit.minDistance=.25;orbit.maxDistance=Math.max(8,size.length()*3);orbit.maxPolarAngle=Math.PI*.5;orbit.update();
    $('#view-label').textContent='Product studio';setPressed();const root=findProductNode(inspection);selectProduct(root);needsRender=true;note('Studio produk siap. Geser untuk orbit dan zoom.');
  }catch(error){console.error(error);note('Model produk belum berhasil dimuat. Silakan coba lagi.');}
}
function findProductNode(parent){let found;parent.traverse(o=>{if(!found&&o.userData.kind==='product')found=o;});return found;}
function canStand(x,y){
  const radius=.17;if(x<radius||x>12-radius||y<radius||y>10.5-radius)return false;
  for(const [x1,y1,x2,y2]of sceneInfo.colliders){if(x>x1-radius&&x<x2+radius&&y>y1-radius&&y<y2+radius)return false;}
  for(const placement of sceneInfo.placements){
    if(placement.sku==='LV463-B71')continue;const p=products.find(p=>p.sku===placement.sku);if(!p)continue;
    const a=-placement.rotation*Math.PI/180,dx=x-placement.position[0],dy=y-placement.position[1],lx=dx*Math.cos(a)-dy*Math.sin(a),ly=dx*Math.sin(a)+dy*Math.cos(a);
    if(Math.abs(lx)<p.dimensions[0]/2000+radius&&Math.abs(ly)<p.dimensions[1]/2000+radius)return false;
  }
  if(x>1.37-radius&&x<4.18+radius&&y>3.28-radius&&y<4.24+radius)return false;
  return true;
}
function move(dt){
  if(mode!=='walk'||!visible||!keys.size)return;
  let forward=(keys.has('KeyW')||keys.has('ArrowUp')||keys.has('forward')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')||keys.has('back')?1:0);
  let side=(keys.has('KeyD')||keys.has('ArrowRight')||keys.has('right')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')||keys.has('left')?1:0);
  const len=Math.hypot(forward,side);if(!len)return;forward/=len;side/=len;const speed=1.45*dt;
  const dx=(-Math.sin(yaw)*forward+Math.cos(yaw)*side)*speed,dz=(-Math.cos(yaw)*forward-Math.sin(yaw)*side)*speed;
  const nx=camera.position.x+dx;if(canStand(nx,-camera.position.z))camera.position.x=nx;
  const nz=camera.position.z+dz;if(canStand(camera.position.x,-nz))camera.position.z=nz;
  needsRender=true;
}
function animate(time){
  rafId=requestAnimationFrame(animate);const dt=Math.min((time-lastTime)/1000,.05);lastTime=time;
  const animating=animations.length>0;
  for(let i=animations.length-1;i>=0;i--){const a=animations[i],t=Math.min((time-a.start)/a.duration,1),e=t*t*(3-2*t);a.part.position.lerpVectors(a.startPosition,a.targetPosition,e);a.part.quaternion.slerpQuaternions(a.startQuaternion,a.targetQuaternion,e);if(t===1)animations.splice(i,1);}
  move(dt);if(orbit.enabled)orbit.update();
  if(visible&&(needsRender||animating)){renderer.render(scene,camera);frameCount++;needsRender=false;}
  if(++uiTick%12===0&&mode==='walk'){
    const x=camera.position.x,y=-camera.position.z;$('#map-dot').setAttribute('cx',5+x/12*230);$('#map-dot').setAttribute('cy',207-y/10.5*202);
    const room=Object.entries(sceneInfo.rooms).find(([,r])=>x>=r.bounds[0]&&y>=r.bounds[1]&&x<=r.bounds[2]&&y<=r.bounds[3]);
    if(room&&room[0]!==currentRoom){currentRoom=room[0];$('#view-label').textContent=roomNames[currentRoom];$$('[data-room]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.room===currentRoom));}
  }
}
export async function start(){
  if(ready)return;if(loading)return start.promise;
  loading=true;$('#load-tour').disabled=true;$('#load-status').textContent='Menyiapkan rumah…';
  start.promise=(async()=>{try{
    [sceneInfo,products]=await Promise.all([fetch('assets/scene.json').then(r=>r.json()),fetch('assets/products.json').then(r=>r.json())]);
    renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<760?1.5:1.75));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    scene=new THREE.Scene();scene.background=new THREE.Color('#cbd0c2');camera=new THREE.PerspectiveCamera(55,1,.07,150);
    const pmrem=new THREE.PMREMGenerator(renderer);const envRoom=new RoomEnvironment();const environment=pmrem.fromScene(envRoom,.05);scene.environment=environment.texture;envRoom.dispose();pmrem.dispose();scene.environmentIntensity=.55;
    scene.add(new THREE.HemisphereLight(0xfff5df,0xb1a58b,1.1));
    const sunlight=new THREE.DirectionalLight(0xffeed2,2.4);sunlight.position.set(-3,12,-16);sunlight.target.position.set(6,0,-5);sunlight.castShadow=true;sunlight.shadow.mapSize.set(innerWidth<760?1024:2048,innerWidth<760?1024:2048);Object.assign(sunlight.shadow.camera,{left:-10,right:10,top:10,bottom:-10,near:.1,far:40});sunlight.shadow.bias=-.0002;sunlight.shadow.normalBias=.025;scene.add(sunlight,sunlight.target);
    const fill=new THREE.DirectionalLight(0xe5efff,.65);fill.position.set(15,8,6);scene.add(fill);
    const draco=new DRACOLoader();draco.setDecoderPath('assets/vendor/draco/');loader=new GLTFLoader();loader.setDRACOLoader(draco);
    const gltf=await loader.loadAsync('assets/sienna-house.glb',event=>{$('#load-status').textContent=event.total?'Memuat rumah '+Math.round(event.loaded/event.total*100)+'%…':'Memuat model rumah…';});
    house=gltf.scene;scene.add(house);house.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}if(o.userData.kind==='product')roots.push(o);if(o.userData.kind==='articulation'){setupPart(o);parts.push(o);}});
    ceiling=new THREE.Mesh(new THREE.PlaneGeometry(12,10.5),new THREE.MeshStandardMaterial({color:0xd5d1c2,roughness:.9}));ceiling.rotation.x=Math.PI/2;ceiling.position.set(6,3.04,-5.25);scene.add(ceiling);
    ground=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshStandardMaterial({color:0xe3ded1,roughness:.9}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;ground.visible=false;scene.add(ground);
    orbit=new OrbitControls(camera,canvas);orbit.enableDamping=true;orbit.dampingFactor=.08;orbit.enabled=false;orbit.addEventListener('change',()=>{needsRender=true;});
    ready=true;showControls();resize();goRoom(currentRoom,true);new ResizeObserver(resize).observe(viewer);new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible)keys.clear();else needsRender=true;},{threshold:0}).observe(viewer);
    canvas.addEventListener('pointerdown',event=>{canvas.focus({preventScroll:true});pointer={x:event.clientX,y:event.clientY,lastX:event.clientX,lastY:event.clientY,id:event.pointerId};dragging=false;if(mode==='walk')canvas.setPointerCapture(event.pointerId);});
    canvas.addEventListener('pointermove',event=>{if(!pointer||pointer.id!==event.pointerId)return;const dx=event.clientX-pointer.lastX,dy=event.clientY-pointer.lastY;if(Math.hypot(event.clientX-pointer.x,event.clientY-pointer.y)>6)dragging=true;if(mode==='walk'&&dragging){yaw-=dx*.004;pitch=THREE.MathUtils.clamp(pitch-dy*.004,-1.25,1.25);camera.quaternion.setFromEuler(new THREE.Euler(pitch,yaw,0,'YXZ'));needsRender=true;}pointer.lastX=event.clientX;pointer.lastY=event.clientY;});
    canvas.addEventListener('pointerup',event=>{if(!pointer)return;if(!dragging&&Math.hypot(event.clientX-pointer.x,event.clientY-pointer.y)<6){const rect=canvas.getBoundingClientRect();pointerNDC.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointerNDC,camera);const hits=ray.intersectObject(mode==='product'?inspection:house,true);const root=hits.length&&findRoot(hits[0].object);if(root)selectProduct(root);}pointer=null;});
    canvas.addEventListener('pointercancel',()=>{pointer=null;});canvas.addEventListener('wheel',event=>{if(mode==='walk'){event.preventDefault();camera.fov=THREE.MathUtils.clamp(camera.fov+event.deltaY*.025,30,82);camera.updateProjectionMatrix();needsRender=true;}},{passive:false});
    canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();note('Konteks grafis terhenti. Muat ulang halaman untuk membuka model kembali.');});
    window.addEventListener('keydown',event=>{if(!ready||!visible||document.querySelector('dialog[open]')||/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName))return;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.code)&&viewer.contains(document.activeElement)){event.preventDefault();keys.add(event.code);}if(event.code==='Escape'){keys.clear();if(mode==='product')goRoom(currentRoom);else closeSelection();}});
    window.addEventListener('keyup',event=>keys.delete(event.code));window.addEventListener('blur',()=>keys.clear());document.addEventListener('visibilitychange',()=>{if(document.hidden)keys.clear();});
    for(const button of $$('[data-move]')){const stop=e=>{keys.delete(button.dataset.move);e.preventDefault();};button.addEventListener('pointerdown',event=>{event.preventDefault();button.setPointerCapture(event.pointerId);keys.add(button.dataset.move);});button.addEventListener('pointerup',stop);button.addEventListener('pointercancel',stop);button.addEventListener('lostpointercapture',()=>keys.delete(button.dataset.move));}
    requestAnimationFrame(animate);emit('tour:ready',{products:roots.length,parts:parts.length});
  }catch(error){console.error(error);$('#load-tour').disabled=false;$('#load-status').textContent='Model 3D belum bisa dibuka. Coba lagi atau unduh GLB.';note('WebGL belum tersedia atau model gagal dimuat. Render dan unduhan tetap dapat digunakan.');loading=false;}})();return start.promise;
}
export function initTour(){
  $('#load-tour').addEventListener('click',start);$$('[data-room]').forEach(b=>b.addEventListener('click',()=>{goRoom(b.dataset.room);if(!ready)start();}));
  $('#walk-mode').addEventListener('click',()=>goRoom(currentRoom));$('#orbit-mode').addEventListener('click',overview);$('#back-house').addEventListener('click',()=>goRoom(currentRoom));$('#reset-view').addEventListener('click',()=>mode==='product'?inspect(inspectionSku):mode==='orbit'?overview():goRoom(currentRoom));
  $('#inspect-product').addEventListener('click',()=>inspect(selectionSku));$('#open-parts').addEventListener('click',toggleParts);$('#close-selection').addEventListener('click',closeSelection);
  $('#help-toggle').addEventListener('click',()=>{const help=$('#viewer-help');help.hidden=!help.hidden;$('#help-toggle').setAttribute('aria-expanded',String(!help.hidden));});$('#close-help').addEventListener('click',()=>{$('#viewer-help').hidden=true;$('#help-toggle').setAttribute('aria-expanded','false');});
  $('#fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(viewer.requestFullscreen)await viewer.requestFullscreen();else note('Mode layar penuh tidak tersedia pada browser ini.');}catch{note('Browser tidak mengizinkan layar penuh.');}});
  $('#map-toggle').addEventListener('click',()=>{const map=$('#floor-map'),hidden=!map.hasAttribute('hidden');map.toggleAttribute('hidden',hidden);$('#map-toggle').setAttribute('aria-expanded',String(!hidden));$('#map-toggle span').textContent=hidden?'＋':'−';});
  // Read-only diagnostics also support repeatable browser verification.
  window.sienna={get ready(){return ready},get mode(){return mode},get room(){return currentRoom},get selected(){return selectionSku},get productCount(){return roots.length},get partsCount(){return parts.length},get frames(){return frameCount},get position(){return camera?camera.position.toArray():null},get renderInfo(){return renderer?.info.render},inspect,goRoom,overview,toggleParts,canStand,
    get orientation(){return camera?.quaternion.toArray()},get fov(){return camera?.fov},
    productScreenPoint(sku){const root=roots.find(r=>r.userData.product_id===sku);if(!root)return null;camera.updateMatrixWorld();const center=new THREE.Box3().setFromObject(root).getCenter(new THREE.Vector3()).project(camera),r=canvas.getBoundingClientRect();return{x:r.left+(center.x+1)*r.width/2,y:r.top+(1-center.y)*r.height/2};},
    select:sku=>selectProduct(roots.find(r=>r.userData.product_id===sku)),
    partState:()=>selected?movingParts(selected).map(p=>({action:p.userData.action,open:p.userData.open,position:p.position.toArray(),quaternion:p.quaternion.toArray()})):[],
    validatePath:points=>points.every(([x,y])=>canStand(x,y)),
    async validateModels(){const results=[];for(const p of products){const g=await loader.loadAsync(p.model);let count=0;g.scene.traverse(o=>{if(o.isMesh)count++;});results.push({sku:p.sku,meshes:count,products:!!findProductNode(g.scene)});disposeModel(g.scene);}return results;}
  };
}
