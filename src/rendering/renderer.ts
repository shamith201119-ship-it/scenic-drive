import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { qualitySettings, type Quality } from '../world/chunks';
export type Weather = 'clear' | 'overcast' | 'rain';
export type TimeOfDay = 'day' | 'sunset' | 'night';
export function createRenderer(canvas: HTMLCanvasElement) {
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1;
  renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const scene=new THREE.Scene(); scene.background=new THREE.Color(0x91b7cb); scene.fog=new THREE.FogExp2(0x91b7cb,0.0025);
  const camera=new THREE.PerspectiveCamera(62,1,0.1,2500);
  const hemi=new THREE.HemisphereLight(0xb6d8ef,0x545141,2); scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xffedce,3.2); sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048); sun.shadow.camera.left=-70; sun.shadow.camera.right=70; sun.shadow.camera.top=70; sun.shadow.camera.bottom=-70; sun.shadow.camera.near=1; sun.shadow.camera.far=350; sun.shadow.bias=-0.0003; sun.shadow.normalBias=0.08; scene.add(sun,sun.target);
  const sky=new Sky(); sky.scale.setScalar(1800); scene.add(sky);
  const uniforms=sky.material.uniforms;
  uniforms.turbidity.value=5; uniforms.rayleigh.value=2; uniforms.mieCoefficient.value=0.005; uniforms.mieDirectionalG.value=0.8;
  const composer=new EffectComposer(renderer); composer.addPass(new RenderPass(scene,camera));
  const bloom=new UnrealBloomPass(new THREE.Vector2(1,1),0.16,0.3,1.5); composer.addPass(bloom); composer.addPass(new OutputPass());
  const rainPositions=new Float32Array(1600*3);
  for(let i=0;i<1600;i++) { rainPositions[i*3]=Math.random()*90-45; rainPositions[i*3+1]=Math.random()*45; rainPositions[i*3+2]=Math.random()*90-45; }
  const rainGeometry=new THREE.BufferGeometry(); rainGeometry.setAttribute('position',new THREE.BufferAttribute(rainPositions,3));
  const rain=new THREE.Points(rainGeometry,new THREE.PointsMaterial({color:0xc3d6e3,size:0.11,transparent:true,opacity:0.7,depthWrite:false})); rain.frustumCulled=false; rain.visible=false; scene.add(rain);
  let quality:Quality='medium', weather:Weather='clear', time:TimeOfDay='day';
  function resize():void { const w=window.innerWidth,h=window.innerHeight; renderer.setSize(w,h); composer.setSize(w,h); camera.aspect=w/h; camera.updateProjectionMatrix(); }
  function setQuality(next:Quality):void {
    quality=next; renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1,qualitySettings[next].ratio)); composer.setPixelRatio(renderer.getPixelRatio());
    renderer.shadowMap.enabled=next!=='low'; bloom.enabled=next==='high'; resize();
  }
  function setEnvironment(nextWeather:Weather,nextTime:TimeOfDay):void {
    weather=nextWeather; time=nextTime;
    const night=time==='night', sunset=time==='sunset', cloudy=weather!=='clear';
    const fogColor=new THREE.Color(night?0x111b31:cloudy?0x82969f:sunset?0xc79f89:0x91b7cb);
    (scene.fog as THREE.FogExp2).color.copy(fogColor); (scene.background as THREE.Color).copy(fogColor);
    (scene.fog as THREE.FogExp2).density=weather==='rain'?0.006:cloudy?0.004:0.0025;
    hemi.intensity=night?0.32:cloudy?1.3:1.9; sun.intensity=night?0.24:cloudy?0.9:3;
    sun.color.set(night?0x9cadf0:sunset?0xffb46e:0xffedce);
    const direction=new THREE.Vector3(0.65,night?-0.15:sunset?0.09:0.7,-0.35).normalize();
    uniforms.sunPosition.value.copy(direction); uniforms.turbidity.value=cloudy?15:5; uniforms.rayleigh.value=sunset?3:2;
    sky.visible=!night; renderer.toneMappingExposure=night?0.8:1;
    rain.visible=weather==='rain';
  }
  function update(dt:number,target:THREE.Vector3):void {
    sun.position.copy(target).add(new THREE.Vector3(65,time==='sunset'?35:100,-50)); sun.target.position.copy(target); sky.position.copy(target);
    if(rain.visible) {
      rain.position.copy(target);
      for(let i=0;i<1600;i++) { rainPositions[i*3+1]-=dt*25; if(rainPositions[i*3+1]<0) rainPositions[i*3+1]+=45; }
      rainGeometry.attributes.position.needsUpdate=true;
    }
  }
  function render():void { if(quality==='high') composer.render(); else renderer.render(scene,camera); }
  window.addEventListener('resize',resize); setQuality('medium'); setEnvironment('clear','day');
  return {renderer,scene,camera,setQuality,setEnvironment,update,render};
}
