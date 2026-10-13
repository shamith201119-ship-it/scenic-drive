import './styles.css';
import * as THREE from 'three';
import { createRenderer, type Weather, type TimeOfDay } from './rendering/renderer';
import { ChunkWorld } from './world/chunks';
import { biomeAt, roadAt } from './world/road';
import { terrainHeight } from './world/terrain';
import { createVehicle, stepVehicle } from './vehicle/physics';
import { createCar } from './vehicle/model';
import { createControls, hasManualInput } from './input/controls';
import { createCameras } from './camera/cameras';
import { createEngineAudio } from './audio/engine';
import { createInterface, element } from './ui/interface';
function boot():void {
  const canvas=element<HTMLCanvasElement>('game');
  canvas.tabIndex=0;
  const graphics=createRenderer(canvas);
  const world=new ChunkWorld(graphics.scene,'medium'),car=createCar();graphics.scene.add(car.root);
  let state=createVehicle(),paused=true,started=false,autodrive=false,cameraName='Chase';
  let weather:Weather='clear',time:TimeOfDay='day';
  const origin=new THREE.Vector3(),position=new THREE.Vector3();
  const cameras=createCameras(graphics.camera),audio=createEngineAudio();
  function pause(value:boolean):void {
    paused=value;controls.clear();ui.pause(paused,started);
    if(!paused) canvas.focus({preventScroll:true});
  }
  function reset(z=state.z):void {
    const distance=state.distance;state=createVehicle(z);state.distance=distance;cameras.reset();
    origin.set(state.x,0,Math.floor(z/160)*160);world.update(z,origin,true);
  }
  function action(name:string):void {
    if(name==='start') {started=true;pause(false);void audio.start().catch(()=>ui.message('Audio unavailable; driving is unaffected.'));}
    else if(name==='pause') pause(!paused);
    else if(name==='blur') pause(true);
    else if(name==='reset') reset();
    else if(name==='camera') cameraName=cameras.cycle();
    else if(name==='autodrive') autodrive=!autodrive;
    else if(name==='remapping') ui.message('Press a new key for the selected control.');
    else if(name==='mapped') ui.message('Control updated for this session.');
  }
  const controls=createControls(action);
  const ui=createInterface({action,quality:quality=>{world.setQuality(quality);graphics.setQuality(quality);world.update(state.z,origin,true);},environment:(w,t)=>{weather=w;time=t;graphics.setEnvironment(w,t);},route:z=>{world.setQuality(world.quality);reset(z);},audio:audio.setEnabled,autodrive:value=>{autodrive=value;},remap:controls.remap});
  pause(true);world.update(state.z,origin,true);
  canvas.addEventListener('pointerdown',()=>canvas.focus({preventScroll:true}));
  canvas.addEventListener('webglcontextlost',event=> {event.preventDefault();pause(true);ui.message('Graphics context lost. Reload the page to recover.');});
  let last=performance.now(),accumulator=0,elapsed=0,smoothedFps=60,hudTimer=0;
  const fixed=1/120;
  function frame(now:number):void {
    const dt=Math.min(0.05,Math.max(0,(now-last)/1000));last=now;elapsed+=dt;
    smoothedFps+=(1/Math.max(dt,0.001)-smoothedFps)*0.04;
    let input=controls.sample();
    if(!paused) {
      if(autodrive && hasManualInput(input)) {
        autodrive=false;
        ui.message('Manual driving enabled. Press P to re-enable scenic autopilot.');
      }
      accumulator+=dt;
      while(accumulator>=fixed) {
        if(autodrive) {
          const look=roadAt(state.z+Math.max(14,state.speed*0.6));
          const desired=Math.atan2(look.x-2-state.x,Math.max(8,Math.max(14,state.speed*0.6)));
          const error=Math.atan2(Math.sin(desired-state.heading),Math.cos(desired-state.heading));
          input={throttle:state.speed<24?0.8:0,brake:state.speed>27?0.25:0,steer:THREE.MathUtils.clamp(error*4,-1,1),handbrake:false};
        }
        stepVehicle(state,input,fixed,weather==='rain');accumulator-=fixed;
      }
    } else accumulator=0;
    const nextOriginZ=Math.floor(state.z/160)*160;
    if(Math.abs(nextOriginZ-origin.z)>=160 || Math.abs(state.x-origin.x)>150) {origin.set(state.x,0,nextOriginZ);cameras.reset();}
    world.update(state.z,origin);
    const r=roadAt(state.z),onRoad=Math.abs(state.x-r.x)<5;
    position.set(state.x-origin.x,(onRoad?r.y:terrainHeight(state.x,state.z))+0.04,state.z-origin.z);
    car.root.position.copy(position);car.animate(state,paused?0:dt,r.slope,time==='night');
    cameras.update(position,state.heading,state.speed,dt,elapsed);graphics.update(paused?0:dt,position);graphics.render();
    audio.update(state.speed,input.throttle,paused,weather==='rain');
    hudTimer+=dt;if(hudTimer>0.1) {hudTimer=0;ui.update({speed:state.speed,distance:state.distance,biome:biomeAt(state.z),camera:cameraName,autodrive,fps:smoothedFps,chunks:world.count,calls:graphics.renderer.info.render.calls});}
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
try {boot();} catch(error) {
  console.error(error);
  const message=document.getElementById('message');if(message) message.textContent='The game could not start. Use a modern browser with WebGL2 and hardware acceleration enabled.';
  const start=document.getElementById('start') as HTMLButtonElement|null;if(start) {start.disabled=true;start.textContent='GRAPHICS UNAVAILABLE';}
}
