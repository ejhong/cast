import * as THREE from 'three';

export {THREE};
export const clamp = (v, a=0, b=1) => Math.max(a, Math.min(b, v));
export const smooth = (a,b,v) => { const t=clamp((v-a)/(b-a)); return t*t*(3-2*t); };
export const mix = (a,b,t) => a+(b-a)*t;
export function random(seed=9271) { return () => { seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296; }; }

function texture(kind, seed=72) {
  const size=512, canvas=document.createElement('canvas'); canvas.width=canvas.height=size;
  const ctx=canvas.getContext('2d'), rng=random(seed), image=ctx.createImageData(size,size);
  for (let y=0;y<size;y++) for (let x=0;x<size;x++) {
    const i=(y*size+x)*4;
    let v=182+(rng()-.5)*70;
    if(kind==='wood') v=176+Math.sin(x*.47+Math.sin(y*.012)*2)*6+Math.sin(x*.058+Math.sin(y*.007)*.8)*9+(rng()-.5)*24;
    if(kind==='cloth') v=185+((x%8<3)!==(y%8<3)?30:-25)+(rng()-.5)*10;
    if(kind==='granite') {v=170+(rng()-.5)*105;if(rng()<.055)v=35+rng()*65;}
    image.data[i]=image.data[i+1]=image.data[i+2]=clamp(v,0,255);image.data[i+3]=255;
  }
  ctx.putImageData(image,0,0);
  if(kind==='stone'||kind==='granite') {
    for(let i=0;i<7000;i++) {const x=rng()*size,y=rng()*size,r=.4+rng()*2;ctx.fillStyle=rng()>.6?'rgba(25,30,20,.16)':'rgba(255,255,235,.12)';ctx.beginPath();ctx.ellipse(x,y,r,r*.6,rng()*Math.PI,0,Math.PI*2);ctx.fill();}
  }
  const t=new THREE.CanvasTexture(canvas);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}

export function materials() {
  const rock=texture('stone'), wood=texture('wood'), cloth=texture('cloth'), granite=texture('granite');
  const material=(color,map,roughness=.95,bump=.03)=>new THREE.MeshStandardMaterial({color,map,bumpMap:map,bumpScale:bump,roughness});
  return {
    stone:material('#c1c0b1',rock), limestone:material('#e1d4b4',rock), warmStone:material('#c3ac85',rock),
    granite:material('#b49586',granite,.97,.055), darkStone:material('#5e6760',granite),
    wood:material('#97734b',wood,.95,.012), woodLight:material('#b1976d',wood,.95,.014),
    cloth:material('#d6cfad',cloth,1,.025), rope:material('#b7a580',cloth),
    water:new THREE.MeshStandardMaterial({color:'#7db6af',roughness:.28,metalness:.1,transparent:true,opacity:.7,side:THREE.DoubleSide}),
    glow:new THREE.MeshStandardMaterial({color:'#d49655',emissive:'#e87924',emissiveIntensity:.85,roughness:.7}),
    reaction:material('#cbbf85',rock), ash:material('#d4cdb1',granite),
    charcoal:material('#30362d',granite), ground:new THREE.MeshStandardMaterial({color:'#0b1b14',roughness:1}),
    line:new THREE.LineBasicMaterial({color:'#6f826a',transparent:true,opacity:.32})
  };
}

export function mesh(geometry, material, parent, position=[0,0,0]) {
  const object=new THREE.Mesh(geometry,material);object.position.set(...position);object.castShadow=true;object.receiveShadow=true;parent?.add(object);return object;
}
export function box(parent, material, size, position=[0,0,0]) { return mesh(new THREE.BoxGeometry(...size),material,parent,position); }
export function sphere(parent,material,radius,position=[0,0,0],detail=2) {return mesh(new THREE.IcosahedronGeometry(radius,detail),material,parent,position);}
export function polygon(points,depth=.5,bevel=.025) {
  const s=new THREE.Shape();points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();
  const g=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:bevel>0,bevelSegments:2,steps:1,bevelSize:bevel,bevelThickness:bevel,curveSegments:1});g.translate(0,0,-depth/2);return g;
}
export function outline(parent,points,material,closed=false) {
  const geo=new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p)));
  const line=closed?new THREE.LineLoop(geo,material):new THREE.Line(geo,material);parent.add(line);return line;
}
export function cord(parent,mat,points,radius=.024) {
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  return mesh(new THREE.TubeGeometry(curve,48,radius,6,false),mat,parent);
}
export function slab(parent,mat,w,d,y=0) { return box(parent,mat,[w,.12,d],[0,y-.06,0]); }
export function grains(parent,mat,count,bounds,seed=131) {
  const rng=random(seed), geo=new THREE.IcosahedronGeometry(.027,1), out=new THREE.InstancedMesh(geo,mat,count), dummy=new THREE.Object3D();
  for(let i=0;i<count;i++){dummy.position.set(mix(bounds[0],bounds[1],rng()),mix(bounds[2],bounds[3],rng()),mix(bounds[4],bounds[5],rng()));dummy.scale.setScalar(.35+rng()*1.7);dummy.rotation.set(rng()*6,rng()*6,rng()*6);dummy.updateMatrix();out.setMatrixAt(i,dummy.matrix);}out.castShadow=true;out.receiveShadow=true;parent.add(out);return out;
}
export function makeBasket(parent,mat,pos,scale=.4) {
  const group=new THREE.Group();group.position.set(...pos);group.scale.setScalar(scale);parent.add(group);
  mesh(new THREE.CylinderGeometry(.49,.32,.55,16,1,true),mat,group,[0,.28,0]);
  for(let i=0;i<5;i++){const r=.32+(i+.5)*.034;const ring=mesh(new THREE.TorusGeometry(r,.022,5,32),mat,group,[0,.055+i*.1,0]);ring.rotation.x=Math.PI/2;}
  const handle=mesh(new THREE.TorusGeometry(.47,.029,6,24,Math.PI),mat,group,[0,.56,0]);handle.rotation.z=0;
  return group;
}
export function visibility(group,value) {group.visible=value;}
