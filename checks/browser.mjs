import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const ids=JSON.parse(await readFile(resolve(root,'tests/index.json'),'utf8'));
const base=new URL(process.env.CAST_SITE_URL||'http://127.0.0.1:4193/');
const previews=process.argv.includes('--previews');
const selected=process.argv.find(arg=>arg.startsWith('--studies='))?.slice(10).split(',')||ids;
for(const id of selected)assert.ok(ids.includes(id),`Unknown study ${id}`);
const work=await mkdtemp(join(tmpdir(),'cast-browser-'));
const screenshots=process.env.CAST_SCREENSHOTS||join(work,'screenshots');await mkdir(screenshots,{recursive:true});
const browser=spawn(process.env.CAST_CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',[
  '--headless','--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-extensions',
  '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--remote-debugging-port=0',`--user-data-dir=${join(work,'profile')}`,'about:blank'
],{stdio:['ignore','ignore','pipe']});
class CDP {
  constructor(socket){this.socket=socket;this.seq=0;this.pending=new Map();this.events=[];socket.addEventListener('message',({data})=>{const m=JSON.parse(data);if(!m.id){this.events.push(m);return;}const p=this.pending.get(m.id);if(!p)return;clearTimeout(p.timer);this.pending.delete(m.id);m.error?p.reject(new Error(JSON.stringify(m.error))):p.resolve(m.result);});}
  static async connect(url){const s=new WebSocket(url);await new Promise((resolve,reject)=>{s.addEventListener('open',resolve,{once:true});s.addEventListener('error',reject,{once:true});});return new CDP(s);}
  send(method,params={}){const id=++this.seq;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('CDP timeout: '+method)),20000);this.pending.set(id,{resolve,reject,timer});this.socket.send(JSON.stringify({id,method,params}));});}
  async evaluate(expression){const r=await this.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
  close(){this.socket.close();}
}
let client,browserClient;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
try {
  const endpoint=await new Promise((resolve,reject)=>{let stderr='';const timer=setTimeout(()=>reject(new Error('Chrome startup timed out: '+stderr.slice(-1500))),15000);browser.once('error',e=>{clearTimeout(timer);reject(e);});browser.once('exit',code=>{clearTimeout(timer);reject(new Error('Chrome exited '+code+': '+stderr.slice(-1500)));});browser.stderr.on('data',data=>{stderr+=data;const match=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(match){clearTimeout(timer);resolve(match[1]);}});});
  browserClient=await CDP.connect(endpoint);
  const {targetId}=await browserClient.send('Target.createTarget',{url:'about:blank'});
  const targets=await(await fetch(`http://${new URL(endpoint).host}/json/list`)).json();
  client=await CDP.connect(targets.find(t=>t.id===targetId).webSocketDebuggerUrl);
  await client.send('Page.enable');await client.send('Runtime.enable');await client.send('Network.enable');
  await client.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  async function until(expression,timeout=25000){const end=Date.now()+timeout;do{if(await client.evaluate(expression))return;await wait(120);}while(Date.now()<end);throw new Error('Condition failed: '+expression+'\n'+JSON.stringify(client.events.filter(e=>e.method==='Runtime.exceptionThrown')));}
  async function navigate(path,width=1440,height=1060,ready=true){
    await client.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    const url=new URL(path,base).href;await client.send('Page.navigate',{url});
    await until(`location.href===${JSON.stringify(url)}&&document.readyState==='complete'${ready?"&&document.body.dataset.ready==='true'":''}`);
    await client.evaluate('document.fonts.ready.then(()=>true)');await wait(200);
    assert.ok(await client.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),`Horizontal overflow on ${path} at ${width}px`);
  }
  async function screenshot(name,full=false){
    if(full)await client.evaluate(`Promise.all([...document.images].map(i=>{i.loading='eager';return i.decode().catch(()=>{})})).then(()=>true)`);
    const clip=full?{...await client.evaluate('({x:0,y:0,width:innerWidth,height:Math.min(18000,document.documentElement.scrollHeight)})'),scale:1}:undefined;
    const {data}=await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:full,...(clip?{clip}:{})});await writeFile(join(screenshots,name),Buffer.from(data,'base64'));
  }
  async function click(selector){await client.evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);}
  async function input(id,value){await client.evaluate(`document.getElementById(${JSON.stringify(id)}).value=${JSON.stringify(String(value))};document.getElementById(${JSON.stringify(id)}).dispatchEvent(new Event('input',{bubbles:true}))`);}
  async function imagesLoaded(){assert.ok(await client.evaluate(`Promise.all([...document.images].map(i=>{i.loading='eager';return i.decode().then(()=>i.naturalWidth>0).catch(()=>false)})).then(v=>v.every(Boolean))`),'An image did not load');}

  if(previews){
    for(const id of selected){
      await navigate(`tests/${id}/`,1200,900);
      assert.equal(await client.evaluate('document.body.dataset.webgl'),'ready',`No WebGL for ${id}`);
      await client.evaluate(`{
        const style=document.createElement('style');style.textContent='.scene-view{position:fixed!important;inset:0!important;width:1200px!important;height:900px!important;aspect-ratio:auto!important;z-index:200!important}.scene-hint,.scene-fallback{display:none!important}';document.head.append(style);
        window.castStudy.stage.resize();window.castStudy.stage.draw();
      }`);
      await wait(250);const data=await client.evaluate('document.getElementById("scene").toDataURL("image/png").split(",")[1]');
      await writeFile(resolve(root,'assets/previews',`${id}.png`),Buffer.from(data,'base64'));console.log(`Rendered ${id}`);
    }
    console.log(`${selected.length} model illustrations saved in assets/previews/.`);
  }else{
    await navigate('index.html');await imagesLoaded();
    assert.equal(await client.evaluate('document.querySelectorAll(".study-card").length'),ids.length);
    assert.equal(await client.evaluate('window.castStudy.playing'),false,'Reduced-motion/default playback must be still');
    await screenshot('home-desktop.png');await screenshot('home-full.png',true);
    await input('block-mass',8);await input('load-mass',40);
    assert.equal(await client.evaluate('document.getElementById("trips-output").value'),'200');
    await input('block-mass',1);await input('load-mass',30);
    assert.equal(await client.evaluate('document.getElementById("trips-output").value'),'34','Load calculation must round up');
    await navigate('index.html',390,844);await imagesLoaded();await screenshot('home-mobile.png',true);
    for(const id of ids){
      await navigate(`tests/${id}/`);await imagesLoaded();
      assert.equal(await client.evaluate('document.body.dataset.webgl'),'ready',id);
      await screenshot(`${id}-desktop.png`);
      const first=await client.evaluate('document.getElementById("scene").toDataURL()');
      for(let i=0;i<5;i++){
        await click(`[data-step="${i}"]`);
        assert.equal(await client.evaluate('document.getElementById("step-title").textContent'),await client.evaluate(`window.castStudy.study.steps[${i}].title`));
        assert.equal(await client.evaluate('document.querySelectorAll("[data-step][aria-pressed=true]").length'),1);
      }
      await input('timeline',65);const early=await client.evaluate('document.getElementById("scene").toDataURL()');
      assert.notEqual(early,first,`${id} should visibly change when scrubbed`);
      await input('timeline',650);const before=await client.evaluate('document.getElementById("scene").toDataURL()');await click('#scene-option');
      const after=await client.evaluate('document.getElementById("scene").toDataURL()');assert.notEqual(before,after,`${id} option must affect the model`);await click('#scene-option');
      if(id==='bent-corners'){
        assert.equal(await client.evaluate('document.getElementById("scene").toDataURL()'),before,'Restoring the formwork must restore the same frame');
        for(const [name,progress] of [['stake',110],['wrap',340],['fill',500],['set',740],['release-posts',835],['reveal',930],['finished',1000]]){
          await input('timeline',progress);await screenshot(`bent-corners-${name}.png`);
        }
        await input('timeline',10);await input('timeline',650);
        assert.equal(await client.evaluate('document.getElementById("scene").toDataURL()'),before,'Scrubbing backward must restore hides, posts, fill, and color');
        const geometryCheck=await client.evaluate(`(async()=>{
          const {THREE}=await import('../../shared/geometry.js');
          const stage=window.castStudy.stage,root=stage.scene.getObjectByName('bent-corners'),stone=root.getObjectByName('corner-block');
          const hides=root.children.filter(o=>o.name.includes('hide'));
          const posts=root.children.filter(o=>o.name==='pole-a'||o.name.startsWith('outer-post-'));
          const ray=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0),point=new THREE.Vector3();
          stage.setProgress(.74);
          const hits=[[1,-.4],[-1.1,1],[.4,.8]].map(([x,z])=>{
            ray.set(new THREE.Vector3(x,3,z),down);return ray.intersectObject(stone).length>0;
          });
          const conflicts=[];
          // Sample the release paths against the actual cast mesh and post bounds.
          for(let frame=0;frame<=20;frame++){
            const p=.8+frame/100;stage.setProgress(p);
            const bounds=posts.filter(post=>post.visible).map(post=>new THREE.Box3().setFromObject(post.children[0]).expandByScalar(-.004));
            for(const hide of hides){
              const vertices=hide.geometry.attributes.position;
              for(let i=0;i<vertices.count;i+=7){
                point.fromBufferAttribute(vertices,i).applyMatrix4(hide.matrixWorld);
                if(bounds.some(b=>b.containsPoint(point)))conflicts.push('Hide crosses a post at '+p);
                if(point.y>-.12){
                  ray.set(new THREE.Vector3(point.x,3,point.z),down);
                  const hit=ray.intersectObject(stone)[0];
                  if(hit&&point.y<hit.point.y-.012)conflicts.push('Hide crosses the block at '+p);
                }
                if(conflicts.length>5)break;
              }
              if(conflicts.length>5)break;
            }
            if(conflicts.length>5)break;
          }
          stage.setProgress(.65);return {hits,conflicts};
        })()`);
        assert.deepEqual(geometryCheck.hits,[true,true,false],'Both arms must be filled while the inner corner stays open');
        assert.deepEqual(geometryCheck.conflicts,[],'The formwork needs a clear removal path');
      }
      const scenarios=await client.evaluate('window.castStudy.study.scenarios||[]');
      if(scenarios.length){
        let previous=await client.evaluate('document.getElementById("scene").toDataURL()');
        for(const scenario of scenarios.slice(1)){
          await click(`[data-scenario="${scenario.id}"]`);
          assert.equal(await client.evaluate('document.body.dataset.sequence'),scenario.id);
          assert.equal(await client.evaluate('document.getElementById("scenario-description").textContent'),scenario.description);
          const frame=await client.evaluate('document.getElementById("scene").toDataURL()');assert.notEqual(frame,previous,'Sequence comparison must change the scene');previous=frame;
          for(let i=0;i<5;i++){
            await click(`[data-step="${i}"]`);
            assert.equal(await client.evaluate('document.getElementById("step-title").textContent'),scenario.steps[i].title);
            assert.equal(await client.evaluate(`document.querySelector('[data-step="${i}"] .step-name').textContent`),scenario.steps[i].name);
          }
          await input('timeline',650);await screenshot(`${id}-${scenario.id}.png`);
        }
        await click(`[data-scenario="${scenarios[0].id}"]`);
      }
      await input('timeline',345);assert.equal(await client.evaluate('window.castStudy.progress'),.345);
      await click('#play');await wait(600);assert.ok(await client.evaluate('window.castStudy.progress>.345'),`${id} animation must advance`);await click('#play');
      const paused=await client.evaluate('window.castStudy.progress');await wait(200);assert.equal(await client.evaluate('window.castStudy.progress'),paused);
      const camera=await client.evaluate('window.castStudy.stage.camera.position.toArray().join()');
      await client.evaluate(`document.getElementById('scene').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true}))`);
      assert.notEqual(await client.evaluate('window.castStudy.stage.camera.position.toArray().join()'),camera,'Keyboard orbit should move camera');
      await click('#reset-view');
      await navigate(`tests/${id}/`,390,844);await screenshot(`${id}-mobile.png`,true);
      console.log(`Verified ${id}: stages, scrub, option, playback, camera, mobile.`);
    }
    // Verify static hosting from a repository subdirectory.
    for(const id of ['drainage-nubs','bent-corners']){
      await navigate(`/cast/tests/${id}/`,1000,850);await imagesLoaded();
      assert.equal(await client.evaluate('document.body.dataset.webgl'),'ready');
    }
    // Returning from another chapter must leave the retained WebGL player usable.
    await navigate('tests/pumapunku/');await input('timeline',600);
    await navigate('tests/inca-walls/');
    await client.evaluate('history.back()');
    await until(`location.pathname.endsWith('/tests/pumapunku/')&&document.body.dataset.ready==='true'`);
    await input('timeline',420);await click('#play');await wait(500);
    assert.ok(await client.evaluate('window.castStudy.progress>.42'),'Player must survive browser Back');await click('#play');
    // No-WebGL fallback must show the persisted illustration, with the prose intact.
    const {identifier}=await client.send('Page.addScriptToEvaluateOnNewDocument',{source:`const context=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl'||type==='webgl2'?null:context.call(this,type,...args)}`});
    for(const id of ['drainage-nubs','bent-corners']){
      await navigate(`tests/${id}/`,390,844);await imagesLoaded();
      assert.equal(await client.evaluate('document.body.dataset.webgl'),'unavailable');
      assert.equal(await client.evaluate('document.querySelector(".scene-fallback").hidden'),false);
      await screenshot(`${id}-fallback-mobile.png`);
    }
    await client.send('Page.removeScriptToEvaluateOnNewDocument',{identifier});
    // The atlas and study narrative remain readable without any scripts.
    await client.send('Emulation.setScriptExecutionDisabled',{value:true});
    await navigate('index.html',390,844,false);await imagesLoaded();await screenshot('home-no-js-mobile.png');
    for(const id of ['pumapunku','bent-corners']){
      await navigate(`tests/${id}/`,390,844,false);await imagesLoaded();
      assert.ok(await client.evaluate('document.querySelector("noscript").textContent.includes("Enable JavaScript")'));
    }
    await client.send('Emulation.setScriptExecutionDisabled',{value:false});
    const exceptions=client.events.filter(e=>e.method==='Runtime.exceptionThrown');assert.deepEqual(exceptions,[],'Uncaught browser errors');
    const failures=client.events.filter(e=>e.method==='Network.responseReceived'&&e.params.response.url.startsWith(base.origin)&&e.params.response.status>=400);assert.deepEqual(failures,[],'Failed local resources');
    console.log(`Browser checks passed. Screenshots: ${screenshots}`);
  }
} finally {
  client?.close();if(browserClient){try{await browserClient.send('Browser.close');}catch{}browserClient.close();}browser.kill('SIGTERM');
}
