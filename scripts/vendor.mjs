// Copy only the pinned Three.js modules used by this buildless site.
import fs from 'node:fs/promises';import path from 'node:path';import{fileURLToPath}from'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),source=path.resolve(root,'../../.local/sienna-three/package'),target=path.join(root,'dist/assets/vendor/three');
const seen=new Set();
async function copy(relative){if(seen.has(relative))return;seen.add(relative);const src=path.join(source,relative),dest=path.join(target,relative.replace(/^examples\/jsm\//,'addons/').replace(/^build\//,''));const text=await fs.readFile(src,'utf8');await fs.mkdir(path.dirname(dest),{recursive:true});await fs.copyFile(src,dest);for(const match of text.matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g)){if(match[1].startsWith('.'))await copy(path.posix.normalize(path.posix.join(path.posix.dirname(relative),match[1])));}}
for(const file of ['build/three.module.js','examples/jsm/controls/OrbitControls.js','examples/jsm/loaders/GLTFLoader.js','examples/jsm/loaders/DRACOLoader.js','examples/jsm/environments/RoomEnvironment.js'])await copy(file);
await fs.copyFile(path.join(source,'LICENSE'),path.join(target,'LICENSE.txt'));console.log('Vendored',seen.size,'modules');
