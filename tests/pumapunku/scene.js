import {THREE,box,mesh,polygon,slab,mix,smooth} from '../../shared/geometry.js';

export function build(scene,m) {
  const root=new THREE.Group();scene.add(root);
  slab(root,m.ground,3.6,2.55);
  const stone=new THREE.Group();root.add(stone);stone.position.y=.04;
  const rock=m.stone.clone();
  box(stone,rock,[2.12,1.93,.32],[0,.985,-.25]);
  const profile=(w,top,bottom)=>[[-1.06,0],[-w,0],[-w,bottom],[w,bottom],[w,0],[1.06,0],[1.06,2.05],[w,2.05],[w,top],[-w,top],[-w,2.05],[-1.06,2.05]];
  mesh(polygon(profile(.29,1.47,.56),.28,.018),rock,stone,[0,0,0]);
  mesh(polygon(profile(.43,1.31,.79),.22,.018),rock,stone,[0,0,.23]);
  // The recesses remain open to the face, so inserts can withdraw along +Z.
  const molds=new THREE.Group();root.add(molds);const parts=[];
  const part=(size,pos,delta,mat=m.wood)=>{const a=box(molds,mat,size,pos);parts.push({a,pos,delta});return a;};
  part([.13,2.19,.96],[-1.17,1.1,-.01],[-.8,0,0]);
  part([.13,2.19,.96],[1.17,1.1,-.01],[.8,0,0]);
  part([2.48,2.19,.13],[0,1.1,-.59],[0,0,-.8]);
  part([2.5,.14,1.14],[0,-.035,-.02],[0,-.02,0],m.woodLight);
  const frontMaterial=m.wood.clone();frontMaterial.transparent=true;frontMaterial.opacity=.3;frontMaterial.depthWrite=false;
  const front=part([2.45,2.16,.12],[0,1.1,.61],[0,.05,.85],frontMaterial);front.castShadow=false;
  for(const x of [-.98,.98])part([.1,2.27,.1],[x,1.1,.72],[0,.05,.85],m.woodLight);
  const lower=new THREE.Group();molds.add(lower);lower.position.set(0,.36,.17);
  box(lower,m.woodLight,[.83,.75,.2],[0,.02,.15]);box(lower,m.woodLight,[.55,.53,.2],[0,-.1,-.06]);
  const upper=new THREE.Group();molds.add(upper);upper.position.set(0,1.75,.17);
  box(upper,m.woodLight,[.83,.71,.2],[0,0,.15]);box(upper,m.woodLight,[.55,.55,.2],[0,.08,-.06]);
  const dowels=[];for(const y of [.36,1.76]){const g=new THREE.CylinderGeometry(.04,.04,.47,12);const peg=mesh(g,m.woodLight,molds,[0,y,.61]);peg.rotation.x=Math.PI/2;dowels.push(peg);}
  const wet=new THREE.Color('#9b9e85'),dry=new THREE.Color('#c6c5b9');
  return {camera:[3.9,3.1,6],target:[0,1.06,.1],extent:4.7,
    update(p,{mold=true}){
      const filling=smooth(.18,.39,p),opening=smooth(.62,.91,p),assembly=1-smooth(.01,.16,p),out=Math.max(opening,assembly*.75);
      stone.scale.y=Math.max(.001,filling);stone.visible=p>.18;rock.color.copy(wet).lerp(dry,smooth(.4,.62,p));
      molds.visible=mold;
      for(const {a,pos,delta}of parts)a.position.set(...pos.map((v,i)=>v+delta[i]*out));
      const spread=smooth(.32,.9,out);
      lower.position.set(-spread*.78,.36-spread*.2,.17+out*1.1);
      upper.position.set(-spread*.78,1.75+spread*.47,.17+out*1.1);
      dowels.forEach((peg,i)=>{peg.position.z=.61+out*1.1;peg.position.x=-spread*.78;peg.position.y=i?1.76+spread*.47:.36-spread*.2;});
      frontMaterial.opacity=mix(.2,.08,opening);
    }
  };
}
