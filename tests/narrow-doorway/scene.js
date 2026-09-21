import {THREE,box,mesh,sphere,cord,makeBasket,smooth,mix,clamp} from '../../shared/geometry.js';

export function build(scene,m) {
  const root=new THREE.Group();scene.add(root);
  const room=new THREE.Group();root.add(room);
  const wallMat=m.stone.clone();wallMat.color.set('#a7afa0');
  box(root,m.darkStone,[5.05,.2,6.55],[0,-.02,-.03]);
  // Low side walls and a partial roof keep the chamber readable as a cutaway.
  for(const x of [-2.3,2.3])for(let j=0;j<2;j++){
    for(let k=0;k<4;k++)box(room,wallMat,[.32,.28,.79],[x,.22+j*.29,-2.7+k*.8]);
  }
  for(let j=0;j<5;j++)for(let k=0;k<5;k++)box(room,wallMat,[.907,.36,.28],[-1.836+k*.918,.28+j*.37,-3.03]);
  const doorway=new THREE.Group();room.add(doorway);
  for(const sign of [-1,1])for(let j=0;j<4;j++){
    box(doorway,wallMat,[1.71,.37,.44],[sign*1.405,.295+j*.38,.65]);
  }
  box(doorway,wallMat,[4.58,.3,.47],[0,1.82,.65]);
  // A partial roof only: the missing part is an illustration cutaway.
  const roof=new THREE.Group();room.add(roof);
  for(let i=0;i<4;i++)box(roof,m.stone,[1.1,.2,.68],[-1.68+i*1.12,2.03,-2.81]);
  for(let i=0;i<13;i++)box(root,m.woodLight,[.035,.005,.07],[0,.086,3.1-i*.18]);
  const vessel=new THREE.Group();root.add(vessel);vessel.position.z=-1.73;
  const castMat=m.warmStone.clone();
  const base=box(vessel,castMat,[1.67,.19,1.92],[0,.19,0]);
  const wallPieces=[
    box(vessel,castMat,[.215,1.02,1.92],[-.7275,.795,0]),
    box(vessel,castMat,[.215,1.02,1.92],[.7275,.795,0]),
    box(vessel,castMat,[1.24,1.02,.215],[0,.795,-.8525]),
    box(vessel,castMat,[1.24,1.02,.215],[0,.795,.8525])
  ];
  const mold=new THREE.Group();root.add(mold);mold.position.z=-1.73;
  const outer=[];
  for(const sign of [-1,1]){
    for(let i=0;i<5;i++){
      const b=box(mold,m.wood,[.105,1.32,.387],[sign*.89,.77,-.774+i*.387]);
      outer.push({b,axis:'x',start:sign*.89,sign});
    }
    for(let i=0;i<4;i++){
      const b=box(mold,m.wood,[.432,1.32,.105],[-.648+i*.432,.77,sign*1.02]);
      outer.push({b,axis:'z',start:sign*1.02,sign});
    }
  }
  for(const sign of [-1,1]){
    const b=box(mold,m.woodLight,[.13,.105,2.08],[sign*.96,1.21,0]);outer.push({b,axis:'x',start:sign*.96,sign});
  }
  const core=new THREE.Group();mold.add(core);
  const inner=[];
  for(const sign of [-1,1]){
    for(let i=0;i<4;i++){
      const b=box(core,m.woodLight,[.065,1.14,.372],[sign*.5875,.895,-.558+i*.372]);
      inner.push({b,axis:'x',start:sign*.5875,sign});
    }
    for(let i=0;i<3;i++){
      const b=box(core,m.woodLight,[.39,1.14,.065],[-.39+i*.39,.895,sign*.7125]);
      inner.push({b,axis:'z',start:sign*.7125,sign});
    }
  }
  const travelingBoard=box(root,m.woodLight,[.085,1.14,.39],[0,.86,2.4]);
  const basket=makeBasket(root,m.rope,[0,0,0],.66);
  const fill=mesh(new THREE.SphereGeometry(.39,20,10,0,Math.PI*2,0,Math.PI/2),m.warmStone,basket,[0,.43,0]);fill.scale.y=.38;
  const chunks=Array.from({length:8},(_,i)=>sphere(root,m.warmStone,.035+(i%3)*.008,[0,0,0],1));
  const supplies=new THREE.Group();root.add(supplies);
  for(const [x,z] of [[.86,2.58],[1.42,2.21],[1.71,2.75]]){
    const waiting=makeBasket(supplies,m.rope,[x,.09,z],.66);
    const load=mesh(new THREE.SphereGeometry(.4,16,8,0,Math.PI*2,0,Math.PI/2),m.warmStone,waiting,[0,.43,0]);load.scale.y=.32;
  }
  for(let i=0;i<4;i++)box(supplies,m.woodLight,[.36,.06,1.18],[-1.49,.14+i*.065,2.25]);
  const rammer=new THREE.Group();root.add(rammer);
  box(rammer,m.woodLight,[.055,.52,.055],[0,.26,0]);box(rammer,m.wood,[.125,.065,.13],[0,.02,0]);
  const sledge=new THREE.Group();root.add(sledge);
  for(const x of [-.56,.56])box(sledge,m.wood,[.13,.12,2.25],[x,.15,0]);
  for(const z of [-.73,0,.73])box(sledge,m.woodLight,[1.81,.09,.14],[0,.24,z]);
  const lifting=new THREE.Group();root.add(lifting);
  for(const z of [-2.25,-1.21])cord(lifting,m.rope,[[-.94,3.1,z],[-.94,.25,z],[0,.12,z],[.94,.25,z],[.94,3.1,z]],.024);
  return {camera:[5.8,8.5,9.2],target:[0,1,-.15],extent:7.25,
    update(p,{walls=true,sequence='cast'}){
      const casting=sequence==='cast',finished=sequence==='finished',before=sequence==='before';
      room.visible=walls;
      const placement=smooth(.2,.58,p),release=smooth(.81,.98,p),assembled=smooth(.04,.19,p);
      vessel.position.set(0,before?mix(2.6,0,placement):finished?.2:0,finished?mix(3.04,1.85,smooth(.2,.48,p)):-1.73);
      vessel.visible=!casting||p>.24;
      const bodyFill=casting?smooth(.35,.6,p):1,baseFill=casting?smooth(.24,.35,p):1;
      base.scale.y=Math.max(.001,baseFill);base.position.y=.095+.095*baseFill;
      wallPieces.forEach(piece=>{piece.scale.y=Math.max(.001,bodyFill);piece.position.y=.285+.51*bodyFill;});
      castMat.color.copy(new THREE.Color(casting?'#aeaa8d':'#c3ac85').lerp(new THREE.Color('#d6c6a3'),casting?smooth(.6,.8,p):1));
      mold.visible=casting;
      supplies.visible=casting;
      outer.forEach(({b,axis,start,sign},i)=>{
        b.visible=assembled>i/outer.length*.7&&p<.98;
        b.position[axis]=start+sign*release*.36;
        b.scale.y=Math.max(.001,assembled);
      });
      inner.forEach(({b,axis,start,sign},i)=>{
        b.visible=p>.09;
        b.position[axis]=start-sign*smooth(.81,.88,p)*.18;
        b.position.y=.895+smooth(.88,.98,p)*(.68+(i%3)*.15);
        b.scale.y=Math.max(.001,assembled);
        b.visible=casting&&p>.09&&p<.98;
      });
      travelingBoard.visible=casting&&p<.18;
      const panelTravel=(p/.18*2)%1;travelingBoard.position.z=mix(2.65,-.52,panelTravel);
      travelingBoard.position.y=.86;
      const delivery=clamp((p-.2)/.4),cycle=(delivery*7)%1;
      basket.visible=casting&&p>=.2&&p<.6;
      basket.position.set(-.48*smooth(.63,.84,cycle),mix(.45,1.38,smooth(.46,.78,cycle)),mix(2.7,-.67,smooth(0,.8,cycle)));
      basket.rotation.z=-smooth(.82,.96,cycle)*.9;
      fill.visible=cycle<.93;
      chunks.forEach((chunk,i)=>{
        chunk.visible=basket.visible&&cycle>.86;
        const t=((cycle-.86)/.14+i/chunks.length)%1;
        chunk.position.set(-.52+(i%3-.8)*.034,mix(1.69,.3+bodyFill,t),-.87+(i%2)*.045);
      });
      rammer.visible=casting&&p>.38&&p<.6;
      rammer.position.set(.71,.32+bodyFill+Math.abs(Math.sin(p*155))*.12,mix(-2.37,-1.04,(p*13)%1));
      sledge.visible=finished;sledge.position.z=vessel.position.z;
      lifting.visible=before&&p<.61;lifting.position.y=before?vessel.position.y:0;
      roof.visible=!before||p>.61;roof.position.y=before?mix(1.1,0,smooth(.61,.8,p)):0;
    }
  };
}
