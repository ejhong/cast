import {createPlayer} from './playback.js';
import {build} from '../tests/pumapunku/scene.js';

const blockMass=document.getElementById('block-mass'),loadMass=document.getElementById('load-mass');
function updateLoads(){
  const mass=Number(blockMass.value),load=Number(loadMass.value);
  document.getElementById('block-output').value=mass.toLocaleString();
  document.getElementById('trips-output').value=Math.ceil(mass*1000/load).toLocaleString();
  document.getElementById('mass-label').value=`${mass} ${mass===1?'tonne':'tonnes'}`;
  document.getElementById('load-label').value=`${load} kg`;
}
blockMass.addEventListener('input',updateLoads);loadMass.addEventListener('input',updateLoads);updateLoads();
async function init(){
  const response=await fetch(new URL('../tests/pumapunku/study.json',import.meta.url));if(!response.ok)throw new Error('Hero study unavailable');
  window.castStudy=createPlayer(await response.json(),build,{hero:true});
}
init().catch(error=>{document.querySelector('.scene-fallback').hidden=false;document.getElementById('play').disabled=true;console.error(error);});
