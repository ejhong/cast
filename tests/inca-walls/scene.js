import {THREE,box,mesh,polygon,cord,smooth,mix} from '../../shared/geometry.js';

export function build(scene,m) {
  const root=new THREE.Group();scene.add(root);
  const stones=[
    [[-2.6,0],[-1.22,0],[-1.06,.65],[-1.34,1.04],[-2.6,.94]],
    [[-1.22,0],[.5,0],[.68,.65],[.13,.87],[-1.06,.65]],
    [[.5,0],[2.6,0],[2.6,1.04],[1.07,1.11],[.68,.65]],
    [[-2.6,.94],[-1.34,1.04],[-.98,1.74],[-1.33,2.18],[-2.6,2.02]],
    [[1.07,1.11],[2.6,1.04],[2.6,2.14],[1.1,2.24],[.88,1.7]],
    [[-2.6,2.02],[-1.33,2.18],[-.7,2.48],[-.76,2.98],[-2.6,2.98]],
    [[-.76,2.98],[-.7,2.48],[-.35,2.22],[.72,2.17],[1.1,2.24],[2.6,2.14],[2.6,2.98]]
  ];
  const joint=.023;
  function shrink(points){const center=points.reduce((a,p)=>[a[0]+p[0]/points.length,a[1]+p[1]/points.length],[0,0]);return points.map(p=>[mix(p[0],center[0],joint),mix(p[1],center[1],joint)]);}
  stones.forEach((pts,i)=>{const mat=m.stone.clone();mat.color.offsetHSL(0,-.025,(i%3-1)*.065);mesh(polygon(shrink(pts),.75,.035),mat,root);});
  const central=[[-1.06,.65],[.13,.87],[.68,.65],[1.07,1.11],[.88,1.7],[1.1,2.24],[.72,2.17],[-.35,2.22],[-.7,2.48],[-1.33,2.18],[-.98,1.74],[-1.34,1.04]];
  const geo=polygon(shrink(central),.8,.04),target=geo.attributes.position.array.slice();
  const stone=mesh(geo,m.warmStone.clone(),root);const center=new THREE.Vector3(-.11,1.51,0);
  const clothGeo=new THREE.PlaneGeometry(3.1,2.36,38,30);const cloth=mesh(clothGeo,m.cloth.clone(),root,[-.05,1.45,.61]);cloth.material.side=THREE.DoubleSide;
  const coords=clothGeo.attributes.position;for(let i=0;i<coords.count;i++){const x=coords.getX(i),y=coords.getY(i);coords.setZ(i,-.085*Math.cos(x*2)*Math.cos(y*2)+Math.sin(x*29+y)*.009);}clothGeo.computeVertexNormals();
  const frame=new THREE.Group();root.add(frame);
  for(const x of [-1.67,1.58])box(frame,m.wood,[.12,2.86,.14],[x,1.43,.69]);
  for(const y of [.17,2.69])box(frame,m.woodLight,[3.42,.12,.14],[-.05,y,.69]);
  for(const x of [-1.67,1.58]){cord(frame,m.rope,[[x,.25,.78],[x-.065,1,.83],[x+.07,2,.83],[x,2.68,.78]],.021);}
  cloth.material.transparent=true;cloth.material.opacity=.42;cloth.material.depthWrite=false;cloth.castShadow=false;
  return {camera:[4.4,3.05,7.4],target:[0,1.37,0],extent:4.8,
    update(p,{mold=true}){
      const placed=smooth(.17,.35,p),fit=smooth(.38,.62,p),remove=smooth(.78,.97,p);
      stone.visible=p>.16;
      const pos=geo.attributes.position;
      for(let i=0;i<pos.count;i++){
        const x=target[i*3]-center.x,y=target[i*3+1]-center.y,z=target[i*3+2],len=Math.hypot(x,y)||1;
        const ox=center.x+x/len*.63,oy=center.y+y/len*.66;
        pos.setXYZ(i,mix(ox,target[i*3],fit),mix(oy,target[i*3+1],fit)+(.8*(1-placed)),z*mix(1.32,1,fit));
      }
      pos.needsUpdate=true;geo.computeVertexNormals();
      const color=new THREE.Color('#a79772').lerp(new THREE.Color('#cbb58e'),smooth(.59,.79,p));stone.material.color.copy(color);
      frame.visible=mold;cloth.visible=mold&&remove<.99;
      frame.position.z=remove*1.6;frame.position.x=remove*.7;cloth.position.z=.61+remove*1.6;cloth.position.x=-.05+remove*.7;
      cloth.material.opacity=mix(.26,.15,remove);
    }
  };
}
