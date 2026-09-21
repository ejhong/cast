import {createPlayer} from './playback.js';

async function init(){
  const id=document.body.dataset.study;
  if(!/^[a-z0-9-]+$/.test(id))throw new Error('Invalid study identifier');
  const base=new URL(`../tests/${id}/`,import.meta.url);
  const response=await fetch(new URL('study.json',base));if(!response.ok)throw new Error(`Study unavailable: ${response.status}`);
  const study=await response.json();const {build}=await import(new URL('scene.js',base));
  window.castStudy=createPlayer(study,build);
}
init().catch(error=>{
  document.querySelector('.scene-fallback').hidden=false;
  document.querySelector('.scene-fallback').textContent='The interactive study could not load. The illustration and explanations are available below.';
  document.getElementById('play').disabled=true;console.error(error);
});
