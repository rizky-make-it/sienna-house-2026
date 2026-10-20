import {initTour,start,inspect} from './tour.js?v=open-gallery-1';
import {initContact,syncDialogScroll} from './contact.js';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let allProducts=[],filter='all',noticeTimer;
const roomCategory=p=>p.sku.startsWith('LV463-B')?'bedroom':p.sku.startsWith('LV446')?'living':'dining';
function renderProducts(){
  const query=$('#product-search').value.toLowerCase().trim();
  const products=allProducts.filter(p=>(filter==='all'||roomCategory(p)===filter)&&(!query||(p.name+' '+p.sku).toLowerCase().includes(query)));
  $('#products').replaceChildren(...products.map(p=>{const button=document.createElement('button');button.className='product-card';button.dataset.sku=p.sku;button.setAttribute('aria-label','Inspeksi 3D '+p.name+', '+p.sku);
    const frame=document.createElement('div');frame.className='product-image';const img=document.createElement('img');img.src='assets/catalogue/'+p.sku+'.jpg';img.alt=p.name+' — referensi katalog SIENNA';img.loading='lazy';img.width=800;img.height=600;frame.append(img);const arrow=document.createElement('span');arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');frame.append(arrow);button.append(frame);
    const sku=document.createElement('span');sku.className='sku';sku.textContent=p.sku;const h=document.createElement('h3');h.textContent=p.name;const dim=document.createElement('span');dim.className='dimension';dim.textContent=p.dimensions.join(' × ')+' mm';button.append(sku,h,dim);
    button.addEventListener('click',()=>{$('#tour').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});inspect(p.sku);});return button;}));
  $('#no-products').hidden=products.length>0;
}
initTour();
initContact();
fetch('assets/products.json').then(r=>{if(!r.ok)throw Error('products');return r.json();}).then(data=>{allProducts=data;renderProducts();}).catch(()=>{$('#no-products').hidden=false;$('#no-products').textContent='Daftar produk belum berhasil dimuat. Silakan muat ulang halaman.';});
$$('[data-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;$$('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',x===b));renderProducts();}));$('#product-search').addEventListener('input',renderProducts);
$('.menu-toggle').addEventListener('click',()=>{const open=$('.menu-toggle').getAttribute('aria-expanded')!=='true';$('.menu-toggle').setAttribute('aria-expanded',String(open));$('#nav').classList.toggle('open',open);$('.menu-toggle span').textContent=open?'−':'＋';});$$('#nav a').forEach(a=>a.addEventListener('click',()=>{$('#nav').classList.remove('open');$('.menu-toggle').setAttribute('aria-expanded','false');$('.menu-toggle span').textContent='＋';}));
$$('[data-enter-tour]').forEach(a=>a.addEventListener('click',()=>start()));
document.addEventListener('tour:notice',e=>{const n=$('#notification');clearTimeout(noticeTimer);n.textContent=e.detail;n.hidden=false;noticeTimer=setTimeout(()=>n.hidden=true,4500);});
const dialog=$('#render-dialog'),labels={master:'The Open Gallery / Exhibition overview',dining:'Dining collection / Eight-seat table & buffet',living:'Living collection / Coffee table & TV unit',guest:'Queen & reading display / Queen Bed'};
let lastRenderTrigger;
$$('[data-render]').forEach(button=>button.addEventListener('click',()=>{const name=button.dataset.render;lastRenderTrigger=button;$('#render-image').src='assets/'+name+'.jpg?v=open-gallery-1';$('#render-image').alt=labels[name]+' — Blender EEVEE 4K';$('#render-caption').textContent=labels[name]+' · EEVEE · 3840 × 2160';$('#render-download').dataset.downloadRequest='render PNG 4K '+labels[name];dialog.showModal();syncDialogScroll();}));
$('#close-render').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});dialog.addEventListener('close',()=>{syncDialogScroll();lastRenderTrigger?.focus({preventScroll:true});});
