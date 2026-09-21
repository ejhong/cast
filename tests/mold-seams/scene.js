import {THREE,box,mesh,smooth,mix} from '../../shared/geometry.js';

export function build(scene,m) {
  const root=new THREE.Group();scene.add(root);
  box(root,m.woodLight,[3.45,.13,1.82],[0,.005,0]);
  const bodyMat=m.limestone.clone(),faceMat=m.limestone.clone();
  faceMat.bumpMap=m.wood.bumpMap;faceMat.bumpScale=.014;
  const hidden=new THREE.MeshBasicMaterial({visible:false}),cast=new THREE.Group();root.add(cast);cast.position.y=.075;
  box(cast,[bodyMat,bodyMat,bodyMat,bodyMat,hidden,bodyMat],[2.62,1.99,.88],[0,.995,-.02]);
  const geo=new THREE.PlaneGeometry(2.62,1.99,240,92),pos=geo.attributes.position;
  const face=mesh(geo,faceMat,cast,[0,.995,.42]);
  const rear=box(root,m.wood,[2.89,2.17,.13],[0,1.14,-.535]);
  const sides=[-1,1].map(sign=>box(root,m.wood,[.13,2.17,1.13],[sign*1.385,1.14,-.02]));
  const boards=[-1,1].map(sign=>{
    const group=new THREE.Group();root.add(group);
    box(group,m.wood,[1.4,2.17,.13],[0,0,0]);
    for(const y of [-.63,.66])box(group,m.woodLight,[1.34,.11,.09],[0,y,.105]);
    return group;
  });
  // A gap yields positive relief. Keep this separate from the wood-grain bump map.
  let lastGap;
  return {camera:[3.5,2.7,7],target:[0,1.03,.22],extent:4.35,
    update(p,{gap=true}){
      const fill=smooth(.19,.4,p),release=smooth(.61,.89,p),open=smooth(.7,.94,p);
      cast.visible=p>.19;cast.scale.y=Math.max(.002,fill);
      if(gap!==lastGap){
        for(let i=0;i<pos.count;i++){
          const x=pos.getX(i),y=pos.getY(i);
          const profile=Math.exp(-Math.pow(x/.037,4));
          pos.setZ(i,gap?profile*(.105+.012*Math.sin(y*8)+.005*Math.cos(y*23)):0);
        }
        pos.needsUpdate=true;geo.computeVertexNormals();lastGap=gap;
      }
      const cured=smooth(.42,.6,p);
      bodyMat.color.copy(new THREE.Color('#b0ae95').lerp(new THREE.Color('#e1d4b4'),cured));faceMat.color.copy(bodyMat.color);
      boards.forEach((board,i)=>{const sign=i?1:-1;board.position.set(sign*(.7+(gap?.035:0)+open*1.06),1.14,.54+release*.6);board.rotation.y=sign*open*.27;});
      sides.forEach((side,i)=>{side.position.x=(i?1:-1)*(1.385+release*.34);});
      rear.position.z=-.535-release*.4;
    }
  };
}
