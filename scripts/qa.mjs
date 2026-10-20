import {spawn}from'node:child_process';import{mkdir,writeFile}from'node:fs/promises';import{fileURLToPath}from'node:url';import path from'node:path';import assert from'node:assert/strict';
import {contactConfig} from '../dist/contact-config.js';import {normalizeWhatsAppNumber} from '../dist/contact.js';
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'.local');await mkdir(out,{recursive:true});const preliminary=process.argv.includes('--preliminary'),pause=ms=>new Promise(r=>setTimeout(r,ms)),siteUrl=process.argv.find(arg=>arg.startsWith('--url='))?.slice(6)||'http://127.0.0.1:4174/',remote=new URL(siteUrl).hostname!=='127.0.0.1';
const contactOnly=process.argv.includes('--contact-only');
const coldProductOnly=process.argv.includes('--cold-product-only');
const mobileNavigationOnly=process.argv.includes('--mobile-navigation-only');
const contactActive=Boolean(contactConfig.whatsappNumber&&!contactConfig.placeholder);
const browser=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--no-first-run','--no-default-browser-check','--disable-background-networking','--remote-debugging-port=9228','--enable-unsafe-swiftshader','--use-angle=swiftshader',`--user-data-dir=${path.join(out,'chrome-profile')}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
let socket,browserSocket;
try{
 let version;for(let i=0;i<60;i++){try{version=await(await fetch('http://127.0.0.1:9228/json/version')).json();break;}catch{await pause(250);}}assert.ok(version,'Chrome failed to start');
 const target=await(await fetch('http://127.0.0.1:9228/json/new?about:blank',{method:'PUT'})).json();socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{socket.addEventListener('open',r,{once:true});socket.addEventListener('error',j,{once:true});});
 let seq=0;const pending=new Map(),errors=[],httpErrors=[],consoleErrors=[];socket.addEventListener('message',e=>{const d=JSON.parse(e.data);if(d.id){const p=pending.get(d.id);if(p){clearTimeout(p.timer);pending.delete(d.id);d.error?p.reject(new Error(JSON.stringify(d.error))):p.resolve(d.result);}}else if(d.method==='Runtime.exceptionThrown')errors.push(d.params.exceptionDetails.exception?.description||d.params.exceptionDetails.text);else if(d.method==='Network.responseReceived'&&d.params.response.status>=400)httpErrors.push(d.params.response.url);else if(d.method==='Runtime.consoleAPICalled'&&d.params.type==='error')consoleErrors.push(d.params.args.map(a=>a.description||a.value).join(' '));});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq,timer=setTimeout(()=>{pending.delete(id);reject(new Error('Timeout '+method));},180000);pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params}));});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
 const until=async(expression,seconds=90)=>{for(let i=0;i<seconds*2;i++){if(await evaluate(expression))return;await pause(500);}throw new Error('Condition timed out: '+expression);};
 const shot=async(name,full=false)=>{const metrics=await send('Page.getLayoutMetrics');const opts={format:'png',captureBeyondViewport:full};if(full)opts.clip={x:0,y:0,width:metrics.cssContentSize.width,height:metrics.cssContentSize.height,scale:1};const s=await send('Page.captureScreenshot',opts);await writeFile(path.join(out,name),Buffer.from(s.data,'base64'));};
 const testContact=async selector=>{
  const s=JSON.stringify(selector),request=await evaluate(`document.querySelector(${s}).dataset.downloadRequest`);
  await evaluate(`document.querySelector(${s}).click()`);
  assert.equal(await evaluate(`document.querySelector('#contact-dialog').open`),true);
  assert.equal(await evaluate(`document.querySelector('#contact-request').textContent`),request);
  assert.equal(await evaluate(`document.body.style.overflow`),'hidden');
  const href=await evaluate(`document.querySelector('#contact-whatsapp').getAttribute('href')`);
  if(contactActive){
   const url=new URL(href);assert.equal(url.origin,'https://wa.me');assert.equal(url.pathname,'/'+normalizeWhatsAppNumber(contactConfig.whatsappNumber));
   assert.ok(url.searchParams.get('text').includes(request));assert.ok(url.searchParams.get('text').includes('Muhammad Rizky'));
   assert.equal(await evaluate(`document.querySelector('#contact-unavailable').hidden`),true);
  }else{
   assert.equal(href,null);assert.equal(await evaluate(`document.querySelector('#contact-unavailable').hidden`),false);
   assert.equal(await evaluate(`document.querySelector('#contact-whatsapp').getAttribute('aria-disabled')`),'true');
   if(contactConfig.placeholder)assert.ok((await evaluate(`document.querySelector('#contact-unavailable').textContent`)).includes('Demo mode'));
  }
  await evaluate(`document.querySelector('#close-contact').click()`);
  await until(`!document.querySelector('#contact-dialog').open&&document.activeElement===document.querySelector(${s})`,5);
 };
 await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:siteUrl});
 await until(`document.readyState==='complete'&&document.querySelectorAll('.product-card').length===14&&document.querySelector('.hero-image').naturalWidth>0`);await evaluate('document.fonts.ready.then(()=>true)');await pause(500);
 assert.equal(await evaluate('document.documentElement.lang'),'en');
 assert.equal(await evaluate(`document.querySelector('#product-search').placeholder`),'Search name / SKU');
 assert.ok((await evaluate(`document.querySelector('.product-card').getAttribute('aria-label')`)).startsWith('Inspect in 3D: '));
 assert.ok((await evaluate(`document.querySelector('.creator-credit').textContent`)).startsWith('Created by Muhammad Rizky'));
 const credits=await evaluate(`fetch('credits.html').then(r=>r.text())`);assert.match(credits,/<html lang="en">/);assert.ok(credits.includes('Sources & licences'));
 assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true,'Desktop overflow');await shot('desktop.png');await shot('desktop-full.png',true);
 for(const[category,count]of[['bedroom',6],['living',5],['dining',3],['all',14]]){await evaluate(`document.querySelector('[data-filter="${category}"]').click()`);assert.equal(await evaluate(`document.querySelectorAll('.product-card').length`),count,'Filter '+category);}
 await evaluate(`document.querySelector('#product-search').value='LV446-L12';document.querySelector('#product-search').dispatchEvent(new Event('input'))`);assert.equal(await evaluate(`document.querySelectorAll('.product-card').length`),1);
 await evaluate(`document.querySelector('#product-search').value='not-a-product';document.querySelector('#product-search').dispatchEvent(new Event('input'))`);assert.equal(await evaluate(`document.querySelector('#no-products').hidden`),false);
 await evaluate(`document.querySelector('#product-search').value='';document.querySelector('#product-search').dispatchEvent(new Event('input'))`);
 for(const room of['master','dining','living','guest']){await evaluate(`document.querySelector('[data-render="${room}"]').click()`);assert.equal(await evaluate(`document.querySelector('#render-dialog').open`),true);await until(`document.querySelector('#render-image').complete&&document.querySelector('#render-image').naturalWidth>0`);assert.match(await evaluate(`document.querySelector('#render-download').dataset.downloadRequest`),/4K PNG render/);await testContact('#render-download');assert.equal(await evaluate(`document.querySelector('#render-dialog').open`),true);assert.equal(await evaluate(`document.body.style.overflow`),'hidden');await evaluate(`document.querySelector('#close-render').click()`);}
 assert.equal(await evaluate(`document.querySelectorAll('a[download]').length`),0);assert.equal(await evaluate(`document.querySelector('.creator-credit').textContent.includes('Muhammad Rizky')`),true);assert.equal(await evaluate(`document.querySelector('meta[name="author"]').content`),'Muhammad Rizky');
 await testContact('.request-all');for(let index=1;index<=6;index++)await testContact('.download-list .download-request:nth-of-type('+index+')');
 console.log('QA desktop, 14 products, galleries, creator credit and all file-request dialogs passed');
 if(contactOnly){await evaluate(`document.querySelector('.request-all').click()`);await shot('contact-desktop.png');await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await until(`!document.querySelector('#contact-dialog').open`);await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await testContact('.request-all');await evaluate(`document.querySelector('.request-all').click()`);assert.equal(await evaluate(`document.querySelector('#contact-dialog').scrollWidth<=document.querySelector('#contact-dialog').clientWidth`),true,'Mobile contact overflow');await shot('contact-mobile.png');await evaluate(`document.querySelector('#close-contact').click()`);await until(`document.body.style.overflow===''`,5);assert.deepEqual(errors,[]);assert.deepEqual(consoleErrors,[]);assert.deepEqual(httpErrors,[]);const report={ok:true,siteUrl,contactConfigured:contactActive,placeholder:contactConfig.placeholder,creator:'Muhammad Rizky',requestButtons:7,galleryRequests:4,desktop:true,mobile:true,nestedDialogs:true,escapeDismissal:true,focusRestored:true,errors,consoleErrors,httpErrors};await writeFile(path.join(out,remote?'qa-contact-live.json':'qa-contact-local.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
 if(coldProductOnly){
  await evaluate(`document.querySelector('.product-card[data-sku="LV446-L12"]').click()`);
  await until(`sienna.ready&&sienna.mode==='product'&&sienna.selected==='LV446-L12'`,150);
  assert.equal(await evaluate('sienna.layout'),'exhibition');await testContact('#download-product');
  await evaluate(`document.querySelector('#back-house').click()`);assert.equal(await evaluate('sienna.mode'),'walk');
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await evaluate(`document.querySelector('#orbit-mode').click()`);assert.equal(await evaluate('sienna.mode'),'orbit');
  await pause(600);assert.equal(await evaluate('sienna.overviewFraming.fits'),true,'Mobile overview crops the exhibition');
  await shot('exhibition-mobile-overview.png');assert.deepEqual(errors,[]);assert.deepEqual(consoleErrors,[]);assert.deepEqual(httpErrors,[]);
  const report={ok:true,siteUrl,coldProductInspection:true,selectedSKU:'LV446-L12',mobileOverview:true,wholeExhibitionFits:true,contactRequest:true,errors,consoleErrors,httpErrors};
  await writeFile(path.join(out,remote?'qa-cold-product-live.json':'qa-cold-product-local.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }
 if(mobileNavigationOnly){
  await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
  const touch=async(type,points=[])=>send('Input.dispatchTouchEvent',{type,touchPoints:points.map(p=>({...p,radiusX:6,radiusY:6,force:1}))});
  const tap=async selector=>{
   const s=JSON.stringify(selector);await evaluate(`document.querySelector(${s}).scrollIntoView({block:'center',behavior:'instant'})`);await pause(100);
   const p=await evaluate(`(()=>{const r=document.querySelector(${s}).getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
   await touch('touchStart',[{id:1,...p}]);await touch('touchEnd');await pause(120);
  };
  const chooseZone=async(id,expanded=false)=>evaluate(`(()=>{const select=document.querySelector(${JSON.stringify(expanded?'#expanded-zone-select':'#zone-select')});select.value=${JSON.stringify(id)};select.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  for(const[width,height]of[[320,568],[360,740],[390,844],[430,932]]){
   await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});
   assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true,`Overflow at ${width}px`);
   assert.equal(await evaluate(`document.querySelector('#zone-select').getBoundingClientRect().height>=48`),true);
   assert.equal(await evaluate(`[...document.querySelectorAll('.mobile-shortcuts a')].every(el=>el.getBoundingClientRect().height>=44)`),true);
  }
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await tap('.mobile-shortcuts a[href="#tour"]');await chooseZone('dining');await chooseZone('master');await until(`sienna.ready&&sienna.frames>0&&sienna.mode==='walk'&&sienna.room==='master'`,150);await chooseZone('overview');assert.equal(await evaluate('sienna.mode'),'orbit');
  await evaluate(`document.querySelector('#viewer-stage').scrollIntoView({block:'center',behavior:'instant'})`);await pause(400);
  const initialDistance=await evaluate('sienna.zoomDistance');await tap('#zoom-in');assert.ok((await evaluate('sienna.zoomDistance'))<initialDistance);await tap('#zoom-out');
  const center=await evaluate(`(()=>{const r=document.querySelector('#canvas').getBoundingClientRect();return{x:r.x+r.width*.55,y:r.y+r.height*.5}})()`);
  const pinchDistance=await evaluate('sienna.zoomDistance');
  await touch('touchStart',[{id:1,x:center.x-28,y:center.y},{id:2,x:center.x+28,y:center.y}]);
  await touch('touchMove',[{id:1,x:center.x-60,y:center.y},{id:2,x:center.x+60,y:center.y}]);await touch('touchEnd');await pause(250);
  assert.ok((await evaluate('sienna.zoomDistance'))<pinchDistance,'Two-finger pinch zoom failed');assert.equal(await evaluate('sienna.selected'),null,'Pinch incorrectly selects furniture');
  for(const id of['master','guest','dining','hall','living']){await chooseZone(id);assert.equal(await evaluate('sienna.mode'),'walk');assert.equal(await evaluate('sienna.room'),id);}
  await evaluate(`document.querySelector('#viewer-stage').scrollIntoView({block:'center',behavior:'instant'})`);await pause(300);
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('#walk-pad')).display`),'none');
  const points=await evaluate(`(()=>{const j=document.querySelector('#joystick').getBoundingClientRect(),r=document.querySelector('#canvas').getBoundingClientRect();return{j:{x:j.x+j.width/2,y:j.y+j.height/2},look:{x:r.x+r.width*.7,y:r.y+r.height*.45}}})()`);
  const before=await evaluate('sienna.position');const orientation=await evaluate('sienna.orientation');
  await touch('touchStart',[{id:1,...points.j}]);await touch('touchMove',[{id:1,x:points.j.x,y:points.j.y-34}]);
  await until('Math.hypot(sienna.movement.x,sienna.movement.y)>.5',5);await pause(500);
  await touch('touchStart',[{id:1,x:points.j.x,y:points.j.y-34},{id:2,...points.look}]);
  await touch('touchMove',[{id:1,x:points.j.x,y:points.j.y-34},{id:2,x:points.look.x+55,y:points.look.y+10}]);await pause(150);
  await until(`JSON.stringify(sienna.orientation)!==${JSON.stringify(JSON.stringify(orientation))}`,10);
  assert.notDeepEqual(await evaluate('sienna.orientation'),orientation,'Second thumb does not look around');
  assert.ok(Math.hypot(...Object.values(await evaluate('sienna.movement')))>.5,'Looking interrupts joystick');
  await touch('touchEnd');await until('Math.hypot(sienna.movement.x,sienna.movement.y)===0',5);
  const after=await evaluate('sienna.position');assert.ok(Math.hypot(after[0]-before[0],after[2]-before[2])>.05,'Joystick did not move the camera');
  await pause(350);assert.deepEqual(await evaluate('sienna.position'),after,'Movement continues after release');
  await touch('touchStart',[{id:1,...points.j}]);await touch('touchMove',[{id:1,x:points.j.x+30,y:points.j.y}]);await touch('touchCancel');await until('Math.hypot(sienna.movement.x,sienna.movement.y)===0',5);
  await shot('mobile-touch-walk.png');
  await chooseZone('master');await evaluate(`document.querySelector('#viewer-stage').scrollIntoView({block:'center',behavior:'instant'})`);await pause(300);
  const productPoint=await evaluate(`sienna.productScreenPoint('LV463-B02')`);await touch('touchStart',[{id:1,...productPoint}]);await touch('touchEnd');await until(`sienna.selected==='LV463-B02'`,10);
  assert.equal(await evaluate(`document.querySelector('#selection').getBoundingClientRect().top>=document.querySelector('#viewer-stage').getBoundingClientRect().bottom-1`),true,'Product panel covers the touch controls');
  await tap('#inspect-product');await until(`sienna.mode==='product'&&sienna.selected==='LV463-B02'`,100);await pause(700);assert.equal(await evaluate(`document.querySelector('#viewer-stage').getBoundingClientRect().top>=-1`),true,'Product inspection scrolls the camera controls off screen');await shot('mobile-touch-product.png');
  await tap('#fullscreen');assert.equal(await evaluate(`document.querySelector('#viewer').classList.contains('is-expanded')`),true);assert.equal(await evaluate(`document.body.style.overflow`),'hidden');
  await tap('#download-product');assert.equal(await evaluate(`document.querySelector('#contact-dialog').open`),true);await tap('#close-contact');assert.equal(await evaluate(`document.body.style.overflow`),'hidden','Closing contact unlocks the expanded background');
  await chooseZone('living',true);assert.equal(await evaluate('sienna.mode'),'walk');assert.equal(await evaluate('sienna.room'),'living');
  for(const[width,height]of[[320,568],[390,844],[844,390]]){
   await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});await pause(250);
   assert.equal(await evaluate(`document.querySelector('#viewer').getBoundingClientRect().height<=innerHeight+1`),true);
   assert.equal(await evaluate(`document.querySelector('#viewer').scrollWidth<=innerWidth`),true);
   assert.equal(await evaluate(`[...document.querySelectorAll('#viewer-tools button,#zoom-controls button')].filter(el=>el.getClientRects().length).every(el=>{const r=el.getBoundingClientRect();return r.width>=44&&r.height>=44})`),true,'Undersized mobile touch target');
  }
  await shot('mobile-touch-landscape.png');await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await pause(200);await shot('mobile-touch-expanded.png');
  await tap('#fullscreen');assert.equal(await evaluate(`document.body.style.overflow`),'');assert.equal(await evaluate(`getComputedStyle(document.querySelector('.mobile-shortcuts')).display`),'grid');
  await tap('.mobile-shortcuts a[href="#collection"]');assert.equal(await evaluate('location.hash'),'#collection');
  assert.deepEqual(errors,[]);assert.deepEqual(consoleErrors,[]);assert.deepEqual(httpErrors,[]);
  const report={ok:true,siteUrl,mobileSizes:[320,360,390,430],landscape:[844,390],realTouch:true,joystick:true,simultaneousMoveAndLook:true,stopsOnReleaseAndCancel:true,pinchZoom:true,zoomButtons:true,allFiveZones:true,latestZoneDuringLoading:true,productPanelBelowCanvas:true,expandedView:true,expandedZonePicker:true,contactScrollLock:true,quickNavigation:true,errors,consoleErrors,httpErrors};
  await writeFile(path.join(out,remote?'qa-mobile-navigation-live.json':'qa-mobile-navigation-local.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }
 if(!contactOnly&&!coldProductOnly&&!mobileNavigationOnly){
 await evaluate(`document.querySelector('#tour').scrollIntoView({behavior:'instant'});document.querySelector('#load-tour').click()`);await until(`window.sienna?.ready===true`,150);await until(`window.sienna.frames>0`,120);
 assert.equal(await evaluate(`sienna.productCount`),17);assert.equal(await evaluate(`sienna.partsCount`),32);assert.equal(await evaluate(`sienna.mode`),'orbit');assert.equal(await evaluate('sienna.layout'),'exhibition');assert.equal(await evaluate('sienna.wallCount'),0);assert.equal(await evaluate('sienna.hasRoof'),false);assert.equal(await evaluate('sienna.overviewFraming.fits'),true,'Desktop overview crops the exhibition');await shot('exhibition-overview.png');await evaluate(`sienna.goRoom('master')`);assert.equal(await evaluate('sienna.mode'),'walk');await shot('tour-master.png');
 const bedPoint=await evaluate(`sienna.productScreenPoint('LV463-B02')`);await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:bedPoint.x,y:bedPoint.y});await send('Input.dispatchMouseEvent',{type:'mousePressed',x:bedPoint.x,y:bedPoint.y,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:bedPoint.x,y:bedPoint.y,button:'left',clickCount:1});assert.equal(await evaluate('sienna.selected'),'LV463-B02','Actual raycast furniture click failed');await evaluate(`document.querySelector('#close-selection').click()`);
 await evaluate(`document.querySelector('#map-toggle').click()`);assert.equal(await evaluate(`document.querySelector('#floor-map').hasAttribute('hidden')`),true);await evaluate(`document.querySelector('#map-toggle').click()`);assert.equal(await evaluate(`document.querySelector('#floor-map').hasAttribute('hidden')`),false);
 const orientation=await evaluate('sienna.orientation');await send('Input.dispatchMouseEvent',{type:'mousePressed',x:bedPoint.x,y:bedPoint.y,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:bedPoint.x+80,y:bedPoint.y+10,button:'left',buttons:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:bedPoint.x+80,y:bedPoint.y+10,button:'left',clickCount:1});assert.notDeepEqual(await evaluate('sienna.orientation'),orientation,'Drag-to-look failed');const fov=await evaluate('sienna.fov');await send('Input.dispatchMouseEvent',{type:'mouseWheel',x:bedPoint.x,y:bedPoint.y,deltaX:0,deltaY:100});assert.notEqual(await evaluate('sienna.fov'),fov,'Wheel zoom failed');await evaluate(`document.querySelector('#reset-view').click()`);
 for(const room of['guest','living','dining','hall','master']){await evaluate(`document.querySelector('[data-room="${room}"]').click()`);assert.equal(await evaluate('sienna.room'),room);assert.equal(await evaluate('sienna.mode'),'walk');assert.ok((await evaluate('sienna.position')).every(Number.isFinite));assert.equal(await evaluate(`(()=>{const p=sienna.position;return sienna.canStand(p[0],-p[2])})()`),true,'Zone camera starts inside an obstruction: '+room);}
 const paths={livingToMaster:[[5,1],[5,2],[5,3],[5,4],[5,4.65],[5,5.3],[5,6],[5,6.4]],hallToGuest:[[5,5.3],[6,5.3],[7.6,5.3],[7.6,6],[7.6,6.6]],hallToDining:[[7.6,5.3],[7.6,4.65],[7.6,4.35],[6.7,4.3],[6.7,3.5],[6.7,2.5]],livingToDining:[[5.5,2.5],[6,2.5],[6.6,2.5]]};
 for(const[name,points]of Object.entries(paths))assert.equal(await evaluate(`sienna.validatePath(${JSON.stringify(points)})`),true,'Walk route blocked: '+name);
 assert.equal(await evaluate(`sienna.canStand(6,8)`),true,'Removed bedroom wall still blocks walking');assert.equal(await evaluate(`sienna.canStand(6,.6)`),true,'Removed dining partition still blocks walking');assert.equal(await evaluate(`sienna.canStand(2.75,9.0)`),false,'Bed collision missing');assert.equal(await evaluate(`sienna.canStand(-2,5)`),false,'Exhibition floor boundary missing');assert.equal(await evaluate(`sienna.validatePath([[5,7],[6,7],[7,7]])`),true,'Open bedroom crossover blocked');
 await evaluate(`document.querySelector('#viewer').scrollIntoView({behavior:'instant',block:'center'});document.querySelector('[data-room="living"]').click();document.querySelector('#canvas').focus()`);await pause(300);const before=await evaluate('sienna.position'),walkFrame=await evaluate('sienna.frames');await send('Input.dispatchKeyEvent',{type:'keyDown',code:'KeyW',key:'w',windowsVirtualKeyCode:87});await until(`sienna.frames>${walkFrame+4}`,100);await send('Input.dispatchKeyEvent',{type:'keyUp',code:'KeyW',key:'w',windowsVirtualKeyCode:87});const after=await evaluate('sienna.position');console.log('Walk positions',before,after);assert.ok(Math.hypot(after[0]-before[0],after[2]-before[2])>.05,'Keyboard walking did not move');
 await evaluate(`document.querySelector('#orbit-mode').click()`);assert.equal(await evaluate('sienna.mode'),'orbit');await pause(800);await shot('house-overview.png');
 await evaluate(`sienna.select('LV463-D21')`);assert.equal(await evaluate('sienna.selected'),'LV463-D21');await evaluate(`document.querySelector('#inspect-product').click()`);await until(`sienna.mode==='product'&&sienna.selected==='LV463-D21'`,100);await until(`document.querySelector('#open-parts').hidden===false`);const initial=await evaluate('sienna.partState()');assert.equal(initial.length,7);
 assert.ok((await evaluate(`document.querySelector('#download-product').dataset.downloadRequest`)).includes('LV463-D21'));await testContact('#download-product');assert.equal(await evaluate('sienna.mode'),'product');
 await evaluate(`window.__partsBefore=sienna.partState();document.querySelector('#open-parts').click()`);await until(`sienna.partState().some((p,i)=>Math.abs(p.position[2]-window.__partsBefore[i].position[2])>.03)`,100);await until(`sienna.partState().some((p,i)=>Math.abs(p.quaternion[1]-window.__partsBefore[i].quaternion[1])>.1)`,100);await pause(800);const open=await evaluate('sienna.partState()');assert.ok(open.every(p=>p.open));assert.ok(open.some((p,i)=>p.position[2]!==initial[i].position[2]));assert.ok(open.some((p,i)=>p.quaternion[1]!==initial[i].quaternion[1]));await shot('product-open.png');await evaluate(`document.querySelector('#open-parts').click()`);await until(`sienna.partState().every((p,i)=>p.position.every((v,j)=>Math.abs(v-window.__partsBefore[i].position[j])<.00001))`,100);const closed=await evaluate('sienna.partState()');assert.ok(closed.every(p=>!p.open));for(let i=0;i<closed.length;i++)for(let j=0;j<3;j++)assert.ok(Math.abs(closed[i].position[j]-initial[i].position[j])<.00001);
 const models=await evaluate('sienna.validateModels()');assert.equal(models.length,14);assert.ok(models.every(m=>m.meshes>0&&m.products));console.log('QA connected paths, collisions, keyboard, orbit, all 14 GLBs and cabinet animations passed');
 await evaluate(`document.querySelector('#back-house').click()`);await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await evaluate(`window.scrollTo({top:0,behavior:'instant'})`);await pause(800);assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true,'Mobile overflow');await shot('mobile.png');await shot('mobile-full.png',true);
 await evaluate(`document.querySelector('.menu-toggle').click()`);assert.equal(await evaluate(`document.querySelector('.menu-toggle').getAttribute('aria-expanded')`),'true');await evaluate(`document.querySelector('#nav a[href="#collection"]').click()`);assert.equal(await evaluate(`document.querySelector('.menu-toggle').getAttribute('aria-expanded')`),'false');
 await evaluate(`document.querySelector('.product-card[data-sku="LV446-L12"]').click()`);await until(`sienna.mode==='product'&&sienna.selected==='LV446-L12'`);assert.equal(await evaluate(`document.querySelector('#open-parts').hidden`),true);await pause(600);await shot('mobile-studio.png');
 await evaluate(`document.querySelector('#close-selection').click();document.querySelector('#reset-view').click()`);await until(`sienna.mode==='product'&&sienna.selected==='LV446-L12'`);await pause(500);const idleFrame=await evaluate('sienna.frames');await pause(1000);assert.ok((await evaluate('sienna.frames'))-idleFrame<=2,'Viewer keeps rendering while idle');
 let downloads=[],renderProof={};if(!preliminary){downloads=await evaluate(`Promise.all(['assets/models/LV446-L12.glb','assets/sienna-house.glb','downloads/sienna-house.blend','downloads/sienna-project.zip','downloads/SIENNA-CATALOGUE-2026.pdf','downloads/README.txt','downloads/guest-4k.png'].map(async url=>{const r=await fetch(url,{method:'HEAD'});return{url,status:r.status,bytes:Number(r.headers.get('content-length'))};}))`);assert.ok(downloads.every(d=>d.status===200&&d.bytes>0),'Broken project asset');renderProof=await evaluate(`fetch('downloads/render-proof.json').then(r=>r.json())`);assert.equal(Object.keys(renderProof).length,4);assert.ok(Object.values(renderProof).every(p=>p.width===3840&&p.height===2160&&p.sha256.length===64));}
 assert.deepEqual(errors,[],'Runtime exceptions');assert.deepEqual(consoleErrors,[],'Console errors');assert.deepEqual(httpErrors,[],'HTTP errors');
 const report={ok:true,siteUrl,preliminary,layout:'exhibition',walls:0,roof:false,initialView:'orbit',openCrossovers:true,desktop:[1440,1000],mobile:[390,844],catalogueProducts:14,placedProducts:17,movingParts:32,connectedPaths:Object.keys(paths),allModels:models,keyboardWalk:true,raycastSelection:true,dragLook:true,wheelZoom:true,cabinetAnimations:true,mobileMenu:true,downloads,renderProof,errors,consoleErrors,httpErrors};await writeFile(path.join(out,remote?'qa-github-pages.json':preliminary?'qa-preliminary.json':'qa-final.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }
 browserSocket=new WebSocket(version.webSocketDebuggerUrl);await new Promise(r=>browserSocket.addEventListener('open',r,{once:true}));browserSocket.send(JSON.stringify({id:1,method:'Browser.close'}));await pause(250);
}finally{socket?.close();browserSocket?.close();if(browser.exitCode===null)browser.kill();}
