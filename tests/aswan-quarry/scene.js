import {THREE,box,mesh,sphere,grains,random,smooth,mix} from '../../shared/geometry.js';

export function build(scene,m) {
  const root=new THREE.Group();scene.add(root);const quarry=new THREE.Group();root.add(quarry);quarry.position.x=-.75;
  // Leave the top open: a solid box lid would hide every depression in the height field.
  const invisibleTop=new THREE.MeshBasicMaterial({visible:false});
  box(quarry,[m.granite,m.granite,invisibleTop,m.granite,m.granite,m.granite],[3.8,.47,2.7],[0,.13,0]);
  const surfaceGeo=new THREE.PlaneGeometry(3.8,2.7,88,64);surfaceGeo.rotateX(-Math.PI/2);
  const scoops=[[-1.24,-.72],[-.46,-.72],[.35,-.72],[-1.24,.14],[-.46,.14],[-1.24,.95],[-.46,.95]];
  const surface=mesh(surfaceGeo,m.granite,quarry,[0,.37,0]);const original=surfaceGeo.attributes.position.array.slice();
  const baseHeight=(x,z)=>{let depth=0;for(const [cx,cz]of scoops){depth+=.235*Math.exp(-Math.pow((x-cx)/.31,4)-Math.pow((z-cz)/.33,4));}return -depth;};
  const layer=mesh(new THREE.CylinderGeometry(.34,.28,.042,32),m.reaction.clone(),quarry,[.48,.406,.48]);
  const charcoals=[],rng=random(11);
  for(let i=0;i<16;i++){const a=i/16*Math.PI*2,c=sphere(quarry,m.charcoal,.065+rng()*.032,[.48+Math.cos(a)*.36,.46,.48+Math.sin(a)*.36],1);c.scale.y=.7;charcoals.push(c);}
  const flames=[];for(let i=0;i<13;i++){const fire=mesh(new THREE.ConeGeometry(.035+rng()*.025,.26+rng()*.23,5),m.glow,quarry,[.48+(rng()-.5)*.47,.7,.48+(rng()-.5)*.45]);flames.push(fire);}
  const light=new THREE.PointLight('#f6a140',0,4,2);light.position.set(-.27,1.05,.48);root.add(light);
  const pounder=sphere(quarry,m.darkStone,.25,[.48,1.05,.48],3);pounder.scale.set(1,.85,1.1);
  const chips=grains(quarry,m.ash,85,[.09,.88,.4,.46,.12,.86],345);
  const basin=new THREE.Group();basin.position.set(2.07,-.1,.08);root.add(basin);
  box(basin,m.granite,[1.06,.17,1.37],[0,.025,0]);
  for(const x of [-.52,.52])box(basin,m.granite,[.16,1.05,1.37],[x,.49,0]);
  box(basin,m.granite,[1.06,1.05,.16],[0,.49,-.61]);
  const frontMaterial=new THREE.MeshStandardMaterial({color:'#a48e73',transparent:true,opacity:.13,roughness:1,depthWrite:false});
  const front=box(basin,frontMaterial,[.91,1.05,.025],[0,.49,.61]);front.castShadow=false;
  const liquid=box(basin,m.water,[.88,.56,1.13],[0,.47,0]);liquid.castShadow=false;
  const sediment=box(basin,m.warmStone,[.86,.15,1.12],[0,.19,0]);
  const particles=grains(basin,m.warmStone,120,[-.4,.4,.17,.77,-.53,.53],183);
  return {camera:[4.6,4.8,7],target:[.1,.44,.05],extent:5.5,
    update(p,{treatment=true}){
      const heat=smooth(.17,.29,p)*(1-smooth(.38,.45,p)),remove=smooth(.62,.8,p);
      for(let i=0;i<surfaceGeo.attributes.position.count;i++){
        const x=original[i*3],z=original[i*3+2];const d=treatment?.23*remove*Math.exp(-Math.pow((x-.48)/.34,4)-Math.pow((z-.48)/.33,4)):0;
        surfaceGeo.attributes.position.setY(i,baseHeight(x,z)-d);
      }
      surfaceGeo.attributes.position.needsUpdate=true;surfaceGeo.computeVertexNormals();
      layer.visible=treatment&&p>.05&&p<.79;layer.scale.y=Math.max(.05,1-remove);layer.position.y=.406-remove*.2;
      layer.material.color.copy(new THREE.Color('#bea477').lerp(new THREE.Color('#d9d3b4'),smooth(.4,.6,p)));
      layer.material.emissive.set('#d96c14');layer.material.emissiveIntensity=heat*.8;
      flames.forEach((f,i)=>{f.visible=treatment&&heat>.02;f.scale.y=heat*(.7+.3*Math.sin(p*140+i*3));});
      charcoals.forEach(c=>{c.visible=treatment&&p>.13&&p<.43;});light.intensity=treatment?heat*4:0;
      pounder.visible=p>.58&&p<.82;pounder.position.y=.7+Math.abs(Math.sin(p*93))*.55;pounder.rotation.z=Math.sin(p*93)*.16;
      chips.visible=treatment&&p>.61&&p<.84;
      liquid.visible=sediment.visible=particles.visible=treatment&&p>.81;
      liquid.scale.y=Math.max(.04,smooth(.81,.91,p));liquid.position.y=.2+.28*liquid.scale.y;
      particles.scale.y=mix(1,.16,smooth(.88,1,p));particles.position.y=mix(0,.16,smooth(.88,1,p));
    }
  };
}
