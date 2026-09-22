import {THREE,box,mesh,outline,random,smooth,mix} from '../../shared/geometry.js';

// These are drawing dimensions, not a survey of a Valley Temple block.
const left=-1.8,right=1.8,back=-1.05,front=1.5,inside=-.55,turn=.15;
const height=1.08,base=-.135,hideHeight=1.34,gap=.026;
const footprint=[[left,back],[right,back],[right,turn],[inside,turn],[inside,front],[left,front]];

function hideMaterial() {
  // A mottled hide surface, without the woven pattern used in the cloth studies.
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
  const ctx=canvas.getContext('2d'),rng=random(905),data=ctx.createImageData(512,512);
  for(let y=0;y<512;y++)for(let x=0;x<512;x++){
    const i=(y*512+x)*4,v=191+Math.sin(x*.025+Math.sin(y*.019))*9+(rng()-.5)*27;
    data.data[i]=v;data.data[i+1]=v;data.data[i+2]=v;data.data[i+3]=255;
  }
  ctx.putImageData(data,0,0);
  ctx.lineWidth=.7;ctx.strokeStyle='rgba(60,42,24,.12)';
  for(let i=0;i<75;i++){
    const x=rng()*512,y=rng()*512;
    ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+25,y-9,x+30,y+16,x+60,y+8);ctx.stroke();
  }
  const map=new THREE.CanvasTexture(canvas);map.wrapS=map.wrapT=THREE.RepeatWrapping;map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
  return new THREE.MeshStandardMaterial({color:'#bb8e55',map,bumpMap:map,bumpScale:.014,roughness:.96,side:THREE.DoubleSide});
}

function postLabel() {
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=96;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#24392d';ctx.fillRect(0,0,256,96);
  ctx.strokeStyle='#b8b58d';ctx.lineWidth=3;ctx.strokeRect(2,2,252,92);
  ctx.fillStyle='#f1e5c7';ctx.font='32px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('POLE A',128,50);
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map,depthTest:false,transparent:true}));
  sprite.scale.set(.66,.2475,1);sprite.position.y=1.68;return sprite;
}

function makeSheet(root,material,points,direction,index) {
  const lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1]));
  const length=lengths.reduce((a,b)=>a+b,0),columns=Math.ceil(length*24),rows=16;
  const geometry=new THREE.PlaneGeometry(1,1,columns,rows),positions=geometry.attributes.position,uv=geometry.attributes.uv;
  const sheet=mesh(geometry,material.clone(),root);sheet.name=index===0?'corner-hide':`outer-hide-${index}`;
  function along(distance){
    for(let i=0;i<lengths.length;i++){
      if(distance<=lengths[i]||i===lengths.length-1){const t=Math.min(1,distance/lengths[i]);return [mix(points[i][0],points[i+1][0],t),mix(points[i][1],points[i+1][1],t)];}
      distance-=lengths[i];
    }
  }
  // Keep a vertex column exactly on the bend so the hide cannot cut across Pole A.
  const distances=Array.from({length:columns+1},(_,i)=>i/columns*length);
  if(lengths.length>1){const corner=Math.round(lengths[0]/length*columns);distances[corner]=lengths[0];}
  for(let row=0;row<=rows;row++)for(let col=0;col<=columns;col++)uv.setXY(row*(columns+1)+col,distances[col]/1.8,row/rows);
  return {mesh:sheet,update(p,shown){
    const wrapped=smooth(.21+index*.012,.365+index*.007,p),unfastened=smooth(.8,.835,p);
    sheet.visible=shown&&wrapped>.001;
    for(let row=0;row<=rows;row++)for(let col=0;col<=columns;col++){
      const v=1-row/rows,s=distances[col],point=along(Math.min(s,length*wrapped));
      const peel=smooth(.862+(1-v)*.018,.993,p);
      const ripple=.009*Math.sin(s*18+v*7)*(Math.sin(Math.PI*v)**2);
      const top=hideHeight-.025*Math.sin(s*9+index)**2;
      const distance=peel*(.07+1.04*Math.sin(v*Math.PI/2))+ripple*unfastened;
      const y=base+v*top*Math.cos(peel*1.51)+.05*Math.sin(v*Math.PI)*peel;
      positions.setXYZ(row*(columns+1)+col,point[0]+direction[0]*distance,y,point[1]+direction[1]*distance);
    }
    positions.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();
  }};
}

export function build(scene,m) {
  const root=new THREE.Group();root.name='bent-corners';scene.add(root);
  // The pale plan remains readable while the empty mold is assembled.
  const guide=outline(root,footprint.map(([x,z])=>[x,-.14,z]),new THREE.LineDashedMaterial({color:'#afaa80',dashSize:.1,gapSize:.07,transparent:true,opacity:.55}),true);
  guide.computeLineDistances();
  const shape=new THREE.Shape();footprint.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:true,bevelSize:.016,bevelThickness:.012,bevelSegments:2,steps:1,curveSegments:1});
  geometry.rotateX(-Math.PI/2);
  const stoneMat=m.granite.clone(),stone=mesh(geometry,stoneMat,root,[0,base,0]);stone.name='corner-block';
  const wet=new THREE.Color('#8b8973'),cured=new THREE.Color('#d3b79c');

  const hide=hideMaterial();
  // Each removal vector points away from the stone. The posts lift clear before
  // the inner sheet folds into the empty quadrant, so it cannot pass through A.
  const sheets=[
    makeSheet(root,hide,[[right+gap,turn+gap],[inside+gap,turn+gap],[inside+gap,front+gap]],[1,1],0),
    makeSheet(root,hide,[[left-gap,back-gap],[right+gap,back-gap]],[0,-1],1),
    makeSheet(root,hide,[[left-gap,front+gap],[left-gap,back-gap]],[-1,0],2),
    makeSheet(root,hide,[[right+gap,back-gap],[right+gap,turn+gap]],[1,0],3),
    makeSheet(root,hide,[[inside+gap,front+gap],[left-gap,front+gap]],[0,1],4)
  ];
  const postLocations=[
    [inside+.16,turn+.16,1,1],
    [left-.16,back-.16,-1,-1],
    [right+.16,back-.16,1,-1],
    [right+.16,turn+.16,1,1],
    [inside+.16,front+.16,1,1],
    [left-.16,front+.16,-1,1]
  ];
  const posts=postLocations.map(([x,z,dx,dz],i)=>{
    const group=new THREE.Group();group.name=i===0?'pole-a':`outer-post-${i}`;root.add(group);
    box(group,m.wood,[.27,1.49,.27],[0,.62,0]);
    // Small wooden pin heads illustrate attachment without specifying ancient hardware.
    const pins=new THREE.Group();group.add(pins);
    for(const y of [.25,.76,1.23])for(const side of [0,1]){
      const pin=mesh(new THREE.CylinderGeometry(.027,.031,.36,8),m.woodLight,pins,[0,y,0]);
      if(side)pin.rotation.z=Math.PI/2;else pin.rotation.x=Math.PI/2;
    }
    if(i===0)group.add(postLabel());
    return {group,pins,x,z,dx,dz};
  });

  // A few sinking surface grains make the level change legible without implying
  // a flow solver or a particular recipe. Their motion depends only on progress.
  const grains=new THREE.Group();root.add(grains);grains.name='wet-surface';
  const rng=random(923),grainGeometry=new THREE.IcosahedronGeometry(.023,0),grainMat=m.warmStone.clone();
  for(let i=0;i<80;i++){
    const longArm=i<55,x=longArm?mix(left+.08,right-.08,rng()):mix(left+.08,inside-.08,rng());
    const z=longArm?mix(back+.08,turn-.08,rng()):mix(turn,front-.08,rng());
    const g=mesh(grainGeometry,grainMat,grains,[x,0,z]);g.scale.set(1,.45+rng()*.4,1);
  }

  return {camera:[4.5,6.5,7.3],target:[0,.57,.18],extent:5.35,
    update(p,{mold=true}){
      const filled=smooth(.405,.593,p),set=smooth(.615,.78,p),remove=smooth(.81,.858,p);
      stone.visible=p>.405;stone.scale.y=Math.max(.001,filled);
      stoneMat.color.copy(wet).lerp(cured,set);stoneMat.roughness=mix(.58,.97,set);stoneMat.bumpScale=mix(.018,.043,set);
      guide.material.opacity=mix(.55,.14,filled);
      sheets.forEach(sheet=>sheet.update(p,mold));
      posts.forEach(({group,pins,x,z,dx,dz},i)=>{
        const placed=smooth(.012+i*.013,.105+i*.013,p);
        group.visible=mold&&placed>.001&&remove<1;
        group.position.set(x+dx*remove*.1,(1-placed)*1.15+remove*5.5,z+dz*remove*.1);
        pins.visible=p>.27&&p<.812;
        pins.position.set(dx*smooth(.8,.81,p)*.14,0,dz*smooth(.8,.81,p)*.14);
      });
      grains.visible=p>.415&&p<.75;grains.position.y=base+height*filled-.022-set*.025;
    }
  };
}
