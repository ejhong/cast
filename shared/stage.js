import * as THREE from 'three';
import {OrbitControls} from '../assets/vendor/OrbitControls.js';
import {materials} from './geometry.js';

export class Stage {
  constructor(canvas,build,{hero=false,onInteract=()=>{}}={}) {
    this.canvas=canvas;this.host=canvas.parentElement;this.p=0;this.options={mold:true,drain:true,treatment:true};this.dirty=true;this.visible=true;
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#172d26');this.scene.fog=new THREE.Fog('#172d26',15,36);
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power',preserveDrawingBuffer:true});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFShadowMap;
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.4;
    this.m=materials();
    const hemi=new THREE.HemisphereLight('#f4edd5','#26392e',2.0);this.scene.add(hemi);
    const sun=new THREE.DirectionalLight('#fff0d4',3.3);sun.position.set(-3.8,8,5);sun.castShadow=true;
    sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-7,right:7,top:7,bottom:-7,near:.1,far:30});sun.shadow.bias=-.0005;sun.shadow.normalBias=.035;sun.shadow.radius=5;this.scene.add(sun);
    const fill=new THREE.DirectionalLight('#bdd3c3',1.2);fill.position.set(5,3,-4);this.scene.add(fill);
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(150,150),this.m.ground);floor.rotation.x=-Math.PI/2;floor.position.y=-.15;floor.receiveShadow=true;this.scene.add(floor);
    this.content=build(this.scene,this.m);
    this.extent=this.content.extent||4.6;
    this.camera=new THREE.OrthographicCamera(-3,3,3,-3,.1,100);
    this.camera.position.set(...(this.content.camera||[4.7,3.5,6]));
    this.controls=new OrbitControls(this.camera,canvas);this.controls.target.set(...(this.content.target||[0,1,0]));this.controls.enableDamping=false;this.controls.enablePan=false;this.controls.enableZoom=false;this.controls.minPolarAngle=.3;this.controls.maxPolarAngle=Math.PI/2-.025;
    this.controls.minAzimuthAngle=-Math.PI/2;this.controls.maxAzimuthAngle=Math.PI/2;this.controls.rotateSpeed=.65;
    this.controls.mouseButtons={LEFT:THREE.MOUSE.ROTATE,MIDDLE:null,RIGHT:null};
    this.controls.touches={ONE:THREE.TOUCH.ROTATE,TWO:THREE.TOUCH.DOLLY_ROTATE};
    canvas.style.touchAction='pan-y';
    this.controls.update();this.controls.saveState();
    this.controls.addEventListener('change',()=>this.draw());this.controls.addEventListener('start',onInteract);
    canvas.addEventListener('keydown',e=>{
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))return;e.preventDefault();onInteract();
      if(e.key==='Home'){this.reset();return;}
      const offset=this.camera.position.clone().sub(this.controls.target),s=new THREE.Spherical().setFromVector3(offset);
      if(e.key==='ArrowLeft')s.theta-=.09;if(e.key==='ArrowRight')s.theta+=.09;if(e.key==='ArrowUp')s.phi-=.07;if(e.key==='ArrowDown')s.phi+=.07;
      s.theta=THREE.MathUtils.clamp(s.theta,-Math.PI/2,Math.PI/2);s.phi=THREE.MathUtils.clamp(s.phi,.3,Math.PI/2-.025);
      this.camera.position.copy(this.controls.target).add(new THREE.Vector3().setFromSpherical(s));this.controls.update();this.draw();
    });
    this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(this.host);
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.host.classList.remove('is-ready');this.host.querySelector('.scene-fallback').hidden=false;this.lost=true;});
    canvas.addEventListener('webglcontextrestored',()=>{this.lost=false;this.resize();this.host.classList.add('is-ready');this.host.querySelector('.scene-fallback').hidden=true;});
    this.resize();this.host.classList.add('is-ready');
  }
  resize(){
    const width=this.host.clientWidth,height=this.host.clientHeight;if(!width||!height)return;
    this.renderer.setSize(width,height,false);const aspect=width/height;
    const h=Math.max(this.extent,this.extent/aspect*.93);this.camera.left=-h*aspect/2;this.camera.right=h*aspect/2;this.camera.top=h/2;this.camera.bottom=-h/2;this.camera.updateProjectionMatrix();this.draw();
  }
  setProgress(p,options={}){this.p=p;Object.assign(this.options,options);this.content.update(p,this.options);this.draw();}
  reset(){this.controls.reset();this.draw();}
  draw(){if(this.lost)return;this.renderer.render(this.scene,this.camera);}
  dispose(){this.observer.disconnect();this.controls.dispose();this.scene.traverse(o=>{o.geometry?.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats){if(!m)continue;m.map?.dispose();m.bumpMap?.dispose();m.dispose();}});this.renderer.dispose();}
}

export function unavailable(canvas,error) {
  const host=canvas.parentElement;host.querySelector('.scene-fallback').hidden=false;canvas.hidden=true;
  document.body.dataset.webgl='unavailable';console.warn('3D illustration unavailable:',error.message);
}
