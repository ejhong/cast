import {THREE,box,mesh,smooth,mix} from '../../shared/geometry.js';

export function build(scene,m) {
  const root=new THREE.Group();scene.add(root);
  const top=.67,pressed=.64,radius=.066,helix=.085;
  const pathZ=x=>.14*Math.sin(x*1.3)+.09*x;
  const stone=m.limestone.clone(),hidden=new THREE.MeshBasicMaterial({visible:false});stone.bumpScale=.012;
  box(root,m.woodLight,[4.12,.11,2.67],[0,.005,0]);
  box(root,[stone,stone,hidden,stone,stone,stone],[3.82,.61,2.36],[0,.365,0]);
  const surface=new THREE.PlaneGeometry(3.82,2.36,240,144);surface.rotateX(-Math.PI/2);
  const vertices=surface.attributes.position,smoothDepth=[];
  let twistedDepth=[];
  const strandSamples=Array.from({length:3},(_,strand)=>Array.from({length:421},(_,j)=>{
    const x=mix(-1.8,1.8,j/420),angle=x*13+strand*Math.PI*2/3;
    return [x,pressed+Math.cos(angle)*helix,pathZ(x)+Math.sin(angle)*helix];
  }));
  // Sample the lower envelope of the round strands, including neighboring sections.
  // This is prescribed contact geometry, not a deformation or curing solver.
  for(let i=0;i<vertices.count;i++){
    const x=vertices.getX(i),z=vertices.getZ(i),edge=1-smooth(1.68,1.82,Math.abs(x));
    let low=top;
    const nearest=Math.round((x+1.8)/3.6*420);
    for(const strand of strandSamples)for(let j=Math.max(0,nearest-8);j<=Math.min(420,nearest+8);j++){
      const [sx,sy,sz]=strand[j],d2=(x-sx)**2+(z-sz)**2;
      if(d2<radius*radius)low=Math.min(low,sy-Math.sqrt(radius*radius-d2));
    }
    twistedDepth.push((top-low)*edge);
    const d=z-pathZ(x),r=helix+radius;
    smoothDepth.push(Math.abs(d)<r?Math.max(0,top-pressed+Math.sqrt(r*r-d*d))*edge:0);
    vertices.setY(i,top);
  }
  // Smooth the sampled mesh by one vertex to keep narrow contact edges legible.
  for(let pass=0;pass<2;pass++){
    const next=twistedDepth.slice();
    for(let row=1;row<144;row++)for(let col=1;col<240;col++){
      const i=row*241+col;next[i]=(twistedDepth[i]*4+twistedDepth[i-1]+twistedDepth[i+1]+twistedDepth[i-241]+twistedDepth[i+241])/8;
    }
    twistedDepth=next;
  }
  mesh(surface,stone,root);
  const rope=new THREE.Group();root.add(rope);
  const twist=new THREE.Group();rope.add(twist);
  for(let strand=0;strand<3;strand++){
    const points=[];
    for(let j=0;j<=420;j++){
      const x=mix(-1.8,1.8,j/420),a=x*13+strand*Math.PI*2/3;
      points.push(new THREE.Vector3(x,Math.cos(a)*helix,pathZ(x)+Math.sin(a)*helix));
    }
    const mat=m.rope.clone();mat.color.set(['#bcae85','#998b66','#cdbd94'][strand]);
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),420,radius,10,false),mat,twist);
  }
  const plainPoints=Array.from({length:100},(_,i)=>{const x=mix(-1.8,1.8,i/99);return new THREE.Vector3(x,0,pathZ(x));});
  const plain=mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(plainPoints),150,helix+radius,16,false),m.rope,rope);
  let lastDepth=-1,lastTwisted;
  return {camera:[2.2,5.1,5.6],target:[0,.53,0],extent:4.55,
    update(p,{twisted=true}){
      const contact=smooth(.2,.39,p),lift=smooth(.61,.85,p);
      rope.position.y=mix(1.22,pressed,contact)+lift*.78;
      twist.visible=twisted;plain.visible=!twisted;
      if(contact!==lastDepth||twisted!==lastTwisted){
        const depths=twisted?twistedDepth:smoothDepth;
        for(let i=0;i<vertices.count;i++)vertices.setY(i,top-depths[i]*contact);
        vertices.needsUpdate=true;surface.computeVertexNormals();lastDepth=contact;lastTwisted=twisted;
      }
      stone.color.copy(new THREE.Color('#b8b49b').lerp(new THREE.Color('#e1d4b4'),smooth(.43,.6,p)));
    }
  };
}
