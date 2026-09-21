import {Stage,unavailable} from './stage.js';

export function createPlayer(study,build,{hero=false}={}) {
  const canvas=document.getElementById('scene'),play=document.getElementById('play'),timeline=document.getElementById('timeline');
  const playLabel=play.querySelector('.play-label'),playIcon=play.querySelector('.play-icon');
  const option=document.getElementById('scene-option'),stepButtons=[...document.querySelectorAll('[data-step]')],scenarioButtons=[...document.querySelectorAll('[data-scenario]')];
  let stage,p=study.initial,playing=false,started=false,raf=0,lastTime=0,lastDraw=0,activeStep=-1;
  const options={mold:true,drain:true,treatment:true};
  if(study.control)options[study.control.key]=study.control.checked!==false;
  if(study.scenarios)options.sequence=study.scenarios[0].id;
  const currentSteps=()=>study.scenarios?.find(s=>s.id===options.sequence)?.steps||study.steps;
  function updateLabel(){playLabel.textContent=playing?'Pause':hero?'Watch it take shape':started?'Play process':'Play process';playIcon.textContent=playing?'Ⅱ':'▶';play.setAttribute('aria-label',playing?'Pause animation':'Play process animation');play.setAttribute('aria-pressed',String(playing));}
  function pause(){playing=false;cancelAnimationFrame(raf);updateLabel();document.body.dataset.playing='false';}
  function update(progress){
    p=Math.max(0,Math.min(1,progress));stage?.setProgress(p,options);
    document.body.dataset.progress=p.toFixed(4);
    if(timeline){timeline.value=Math.round(p*1000);document.getElementById('progress-label').value=`${Math.round(p*100)}%`;}
    const nextStep=Math.min(4,Math.floor(p*5)),steps=currentSteps();
    timeline?.setAttribute('aria-valuetext',`Stage ${nextStep+1}: ${steps[nextStep].name}`);
    if(nextStep!==activeStep){
      activeStep=nextStep;
      stepButtons.forEach((button,i)=>{button.setAttribute('aria-pressed',String(i===nextStep));const name=button.querySelector('.step-name');if(name)name.textContent=steps[i].name;});
      if(!hero){document.getElementById('step-number').textContent=`STAGE ${String(nextStep+1).padStart(2,'0')} / 05`;document.getElementById('step-title').textContent=steps[nextStep].title;}
    }
    if(!hero){
      let text=steps[nextStep].text;
      if(study.control.key==='drain'&&!options.drain)text+=' Closed-drain view: the outlet is covered, so this illustration shows no drainage bulge.';
      if(study.control.key==='treatment'&&!options.treatment)text+=' Untreated comparison: the active patch remains intact; no relative removal rate is assumed.';
      if(study.control.offText&&!options[study.control.key])text+=' '+study.control.offText;
      document.getElementById('step-text').textContent=text;
    }
  }
  try {stage=new Stage(canvas,build,{hero,onInteract:pause});document.body.dataset.webgl='ready';}
  catch(error){unavailable(canvas,error);play.disabled=true;}
  function tick(time){
    if(!playing)return;
    if(time-lastDraw>=1000/30){const dt=Math.min((time-lastTime)/1000,.1);lastTime=time;lastDraw=time;update(p+dt/study.duration);}
    if(p>=1){pause();return;}raf=requestAnimationFrame(tick);
  }
  function start(){if(!stage)return;if(!started||p>=.995)update(0);started=true;playing=true;lastTime=lastDraw=performance.now();updateLabel();document.body.dataset.playing='true';raf=requestAnimationFrame(tick);}
  play.addEventListener('click',()=>playing?pause():start());
  timeline?.addEventListener('input',()=>{pause();started=true;update(Number(timeline.value)/1000);});
  stepButtons.forEach((button,i)=>button.addEventListener('click',()=>{pause();started=true;update((i+.55)/5);}));
  option?.addEventListener('change',()=>{options[study.control.key]=option.checked;document.body.dataset.option=String(option.checked);update(p);});
  scenarioButtons.forEach(button=>button.addEventListener('click',()=>{
    pause();started=false;options.sequence=button.dataset.scenario;activeStep=-1;
    document.body.dataset.sequence=options.sequence;
    scenarioButtons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    document.getElementById('scenario-description').textContent=study.scenarios.find(s=>s.id===options.sequence).description;
    update(p);
  }));
  document.getElementById('reset-view')?.addEventListener('click',()=>stage?.reset());
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  const observer=new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)pause();},{threshold:0});observer.observe(canvas.parentElement);
  window.addEventListener('pagehide',event=>{pause();if(!event.persisted){observer.disconnect();stage?.dispose();}});
  window.addEventListener('pageshow',event=>{if(event.persisted)stage?.resize();});
  const controller={stage,study,pause,start,setProgress(progress){pause();started=true;update(progress);},get progress(){return p;},get playing(){return playing;}};
  if(options.sequence)document.body.dataset.sequence=options.sequence;
  updateLabel();update(p);document.body.dataset.ready='true';
  return controller;
}
