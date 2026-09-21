import {THREE,box,mesh,sphere,polygon,grains,smooth,mix} from '../../shared/geometry.js';

export function build(scene,m) {
  const root=new THREE.Group();scene.add(root);
  box(root,m.woodLight,[2.76,.13,1.67],[0,-.005,0]);
  const stoneMat=m.limestone.clone(),block=box(root,stoneMat,[2.35,2.02,1.13],[0,1.07,-.07]);
  const aggregate=grains(root,m.warmStone,400,[-1.13,1.13,.8,2.06,.496,.515],51);
  const mold=new THREE.Group();root.add(mold);
  const left=box(mold,m.wood,[.15,2.2,1.65],[-1.3,1.1,0]);
  const right=box(mold,m.wood,[.15,2.2,1.65],[1.3,1.1,0]);
  const back=box(mold,m.wood,[2.45,2.2,.12],[0,1.1,-.78]);
  const frontShape=new THREE.Shape();frontShape.moveTo(-1.37,0);frontShape.lineTo(1.37,0);frontShape.lineTo(1.37,.9);frontShape.lineTo(-1.37,.9);frontShape.closePath();
  const hole=new THREE.Path();hole.absarc(.64,.45,.253,0,Math.PI*2,true);frontShape.holes.push(hole);
  const front=mesh(new THREE.ExtrudeGeometry(frontShape,{depth:.15,bevelEnabled:false}),m.wood,mold,[0,0,.59]);
  for(const y of [.29,.59]){const line=box(front,m.woodLight,[2.72,.012,.006],[0,y,.152]);}
  const plug=mesh(new THREE.CylinderGeometry(.252,.252,.15,40),m.wood,root,[.64,.45,.67]);plug.rotation.x=Math.PI/2;
  // A front hemisphere represents the retained bulge; the rest is continuous with the block.
  const nub=sphere(root,stoneMat,.254,[.64,.45,.57],4);nub.scale.z=.01;
  const clothGeo=new THREE.PlaneGeometry(.54,.54,32,32),clothMat=m.cloth.clone();clothMat.side=THREE.DoubleSide;
  const cloth=mesh(clothGeo,clothMat,root,[.64,.45,.751]);
  const original=clothGeo.attributes.position.array.slice();
  const interiorLiner=mesh(new THREE.PlaneGeometry(2.34,1.2,30,20),m.cloth.clone(),root,[0,1.5,-.703]);interiorLiner.material.side=THREE.DoubleSide;
  const drops=[];for(let i=0;i<18;i++){const drop=sphere(root,m.water,.022,[0,0,0],1);drop.scale.set(.85,1.7,.85);drops.push(drop);}
  const pool=mesh(new THREE.CircleGeometry(.43,48),m.water,root,[.64,-.079,1.09]);pool.rotation.x=-Math.PI/2;
  const damp=box(root,new THREE.MeshStandardMaterial({color:'#87aba0',transparent:true,opacity:.16,roughness:.5,depthWrite:false}),[2.33,1.45,.008],[0,1.3,.5]);damp.castShadow=false;
  return {camera:[4.4,3.2,6.6],target:[0,.94,.24],extent:4.5,
    update(p,{drain=true}){
      const filled=smooth(0,.18,p),bulge=drain?smooth(.3,.63,p):0,release=smooth(.81,.98,p),flow=drain&&p>.32&&p<.79;
      block.scale.y=Math.max(.001,filled);block.position.y=.06+1.01*filled;aggregate.visible=p>.17;
      stoneMat.color.copy(new THREE.Color('#b4b09a').lerp(new THREE.Color('#ddd1b0'),smooth(.58,.8,p)));
      front.position.z=.59+release*.74;front.position.x=-release*1.25;left.position.x=-1.3-release*.55;right.position.x=1.3+release*.55;back.position.z=-.78-release*.45;
      plug.visible=!drain;plug.position.set(.64-release*1.25,.45,.67+release*.74);
      nub.visible=drain&&p>.3;nub.scale.z=.001+bulge*1.88;
      const pos=clothGeo.attributes.position;
      for(let i=0;i<pos.count;i++){const x=original[i*3],y=original[i*3+1],r=Math.hypot(x,y)/.266;pos.setXYZ(i,x,y,Math.pow(Math.max(0,1-r*r),.65)*bulge*.29);}
      pos.needsUpdate=true;clothGeo.computeVertexNormals();cloth.visible=drain&&p>.17&&release<.98;cloth.position.set(.64-release*1.25,.45,.751+release*.75);
      drops.forEach((d,i)=>{d.visible=flow;const t=(p*25+i/18)%1;d.position.set(.64+Math.sin(i*3.9)*.12,.37-t*.42,1+bulge*.04+t*.1);});
      pool.visible=drain&&p>.36;pool.scale.setScalar(.3+.7*smooth(.36,.76,p));
      damp.visible=p>.16&&release<.85;damp.material.opacity=drain?mix(.16,.035,smooth(.3,.75,p)):.16;
      interiorLiner.position.z=-.703-release*.45;
    }
  };
}
