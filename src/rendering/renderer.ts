import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { qualitySettings, type Quality } from '../world/chunks';
export type Weather = 'clear' | 'overcast' | 'rain';
export type TimeOfDay = 'day' | 'sunset' | 'night';
export function createRenderer(canvas: HTMLCanvasElement) {
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const scene=new THREE.Scene();scene.background=new THREE.Color(0xb6ccdc);scene.fog=new THREE.FogExp2(0xb6ccdc,0.0019);
  const camera=new THREE.PerspectiveCamera(62,1,0.1,2500);
  // Environment illumination makes metallic car paint reflect something other than black.
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();
  const environment=pmrem.fromScene(room,0.04);scene.environment=environment.texture;
  room.dispose();pmrem.dispose();scene.environmentIntensity=0.45;
  const hemi=new THREE.HemisphereLight(0xc5dded,0x877a62,1.25);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xffe7ba,2.6);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-45;sun.shadow.camera.right=45;sun.shadow.camera.top=45;sun.shadow.camera.bottom=-45;sun.shadow.camera.near=1;sun.shadow.camera.far=300;
  sun.shadow.bias=-0.00015;sun.shadow.normalBias=0.045;sun.shadow.radius=3;scene.add(sun,sun.target);
  const sky=new Sky();sky.scale.setScalar(1800);scene.add(sky);
  const uniforms=sky.material.uniforms;uniforms.mieCoefficient.value=0.003;uniforms.mieDirectionalG.value=0.8;
  const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
  const bloom=new UnrealBloomPass(new THREE.Vector2(1,1),0.10,0.45,1.7);composer.addPass(bloom);composer.addPass(new OutputPass());
  // Short line segments replace square point sprites for rain.
  const rainPositions=new Float32Array(900*6);
  for(let i=0;i<900;i++) {
    const x=Math.random()*90-45,y=Math.random()*45,z=Math.random()*90-45;
    rainPositions.set([x,y,z,x-0.1,y-0.9,z],i*6);
  }
  const rainGeometry=new THREE.BufferGeometry();rainGeometry.setAttribute('position',new THREE.BufferAttribute(rainPositions,3));
  const rain=new THREE.LineSegments(rainGeometry,new THREE.LineBasicMaterial({color:0xc5d5e0,transparent:true,opacity:0.24,depthWrite:false}));
  rain.frustumCulled=false;rain.visible=false;scene.add(rain);
  let quality:Quality='medium',weather:Weather='clear',time:TimeOfDay='day';
  const direction=new THREE.Vector3(),sunOffset=new THREE.Vector3();
  function resize():void {
    const w=window.innerWidth,h=window.innerHeight;renderer.setSize(w,h);composer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();
  }
  function setQuality(next:Quality):void {
    quality=next;renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,qualitySettings[next].ratio));composer.setPixelRatio(renderer.getPixelRatio());
    renderer.shadowMap.enabled=next!=='low';bloom.enabled=next==='high';resize();
  }
  function setEnvironment(nextWeather:Weather,nextTime:TimeOfDay):void {
    weather=nextWeather;time=nextTime;
    const night=time==='night',sunset=time==='sunset',cloudy=weather!=='clear';
    const fogColor=new THREE.Color(night?0x14243b:cloudy?0xa8b5ba:sunset?0xd8b39a:0xb6ccdc);
    (scene.fog as THREE.FogExp2).color.copy(fogColor);(scene.background as THREE.Color).copy(fogColor);
    (scene.fog as THREE.FogExp2).density=weather==='rain'?0.0045:cloudy?0.003:0.0019;
    hemi.intensity=night?0.28:cloudy?1.25:1.15;sun.intensity=night?0.18:cloudy?0.65:sunset?2.1:2.7;
    scene.environmentIntensity=night?0.12:cloudy?0.35:0.5;
    sun.color.set(night?0xabc1f4:sunset?0xffc08b:0xffe7ba);
    direction.set(0.65,night?0.45:sunset?0.16:0.65,-0.35).normalize();sunOffset.copy(direction).multiplyScalar(150);
    uniforms.sunPosition.value.copy(direction);uniforms.turbidity.value=cloudy?12:2.5;uniforms.rayleigh.value=sunset?2.2:1.3;
    sky.visible=!night;renderer.toneMappingExposure=night?0.85:1.08;rain.visible=weather==='rain';
  }
  function update(dt:number,target:THREE.Vector3):void {
    sun.position.copy(target).add(sunOffset);sun.target.position.copy(target);sky.position.copy(target);
    if(rain.visible) {
      rain.position.copy(target);
      for(let i=0;i<900;i++) {
        const offset=i*6;rainPositions[offset+1]-=dt*26;
        if(rainPositions[offset+1]<0) rainPositions[offset+1]+=45;
        rainPositions[offset+4]=rainPositions[offset+1]-0.9;
      }
      rainGeometry.attributes.position.needsUpdate=true;
    }
  }
  function render():void {if(quality==='high') composer.render();else renderer.render(scene,camera);}
  window.addEventListener('resize',resize);setQuality('medium');setEnvironment('clear','day');
  return {renderer,scene,camera,setQuality,setEnvironment,update,render};
}
