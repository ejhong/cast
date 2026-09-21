import {THREE,box,mesh,sphere,polygon,makeBasket,grains,smooth,mix} from '../../shared/geometry.js';

export function build(scene,m) {
  const root=new THREE.Group();scene.add(root);
  for(let i=0;i<3;i++)box(root,m.limestone,[1.45,.43,1.7],[-.25+i*1.48-1.3,.1,-.1]);
  const form=new THREE.Group();form.position.set(.7,.37,-.2);root.add(form);
  const block=box(form,m.limestone.clone(),[1.89,1.8,1.4],[0,.9,0]);
  const panels=new THREE.Group();form.add(panels);const parts=[];
  function part(size,pos,delta,mat=m.wood){const a=box(panels,mat,size,pos);parts.push({a,pos,delta});return a;}
  for(const x of [-1.02,1.02]){for(let j=0;j<5;j++)part([.11,.345,1.59],[x,.175+j*.36,0],[Math.sign(x)*.56,0,0]);for(const z of [-.54,.54])part([.09,2.03,.11],[x*1.08,.88,z],[Math.sign(x)*.56,0,0],m.woodLight);}
  for(let j=0;j<5;j++)part([2.14,.345,.11],[0,.175+j*.36,-.81],[0,0,-.65]);
  const frontMat=m.wood.clone();frontMat.transparent=true;frontMat.opacity=.38;frontMat.depthWrite=false;
  for(let j=0;j<5;j++){const a=part([2.14,.345,.11],[0,.175+j*.36,.81],[0,0,.8],frontMat);a.castShadow=false;}
  for(const x of [-.78,.78])part([.12,2.05,.1],[x,.88,.92],[0,0,.8],m.woodLight);
  const basin=new THREE.Group();root.add(basin);basin.position.set(-2.1,-.03,.5);
  mesh(new THREE.CylinderGeometry(.63,.52,.22,24),m.warmStone,basin,[0,.1,0]);
  mesh(new THREE.CylinderGeometry(.55,.55,.015,24),m.limestone,basin,[0,.22,0]);
  const paddle=box(basin,m.wood,[.09,1.0,.07],[.07,.61,0]);paddle.rotation.z=-.34;
  // Two low walls make the narrow delivery route legible without implying a surveyed passage.
  for(const z of [.98,1.63])box(root,m.stone,[2.55,.27,.16],[-.75,.03,z]);
  const basket=makeBasket(root,m.rope,[-1.7,.35,1.32],.58);
  const cargo=grains(basket,m.limestone,55,[-.3,.3,.4,.54,-.25,.25]);
  const tamper=new THREE.Group();root.add(tamper);box(tamper,m.woodLight,[.39,.08,.34]);box(tamper,m.wood,[.07,.85,.07],[0,.44,0]);
  return {camera:[4.5,3.6,6.5],target:[-.2,.85,.2],extent:5.2,
    update(p,{mold=true}){
      const fill=smooth(.38,.64,p),release=smooth(.8,.98,p);
      block.visible=fill>.002;block.scale.y=Math.max(.001,fill);block.position.y=.9*fill;
      block.material.color.copy(new THREE.Color('#b6b299').lerp(new THREE.Color('#e3d7b9'),smooth(.62,.81,p)));
      panels.visible=mold;for(const {a,pos,delta}of parts)a.position.set(...pos.map((v,i)=>v+delta[i]*release));
      const carrying=p>.16&&p<.63,cycle=((p-.16)/.47*3)%1;
      basket.visible=carrying;
      basket.position.set(mix(-1.84,.62,cycle),.3+smooth(.5,1,cycle)*1.7,1.3-smooth(.5,1,cycle)*1.5);
      basket.rotation.z=smooth(.85,1,cycle)*-.6;
      paddle.rotation.z=-.35+Math.sin(p*65)*.1*(1-smooth(.13,.2,p));
      tamper.visible=p>.4&&p<.65;tamper.position.set(.7,.48+fill*1.8+Math.abs(Math.sin(p*160))*.28,-.2);
      frontMat.opacity=mix(.38,.8,release);
    }
  };
}
