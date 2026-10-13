import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { VehicleState } from './physics';
export function createCar(): { root: THREE.Group; animate: (state: VehicleState, dt: number, slope: number, night: boolean) => void } {
  const root=new THREE.Group(), body=new THREE.Group(); root.add(body);
  const paint=new THREE.MeshPhysicalMaterial({color:0xe9b15c,metalness:0.62,roughness:0.26,clearcoat:1,clearcoatRoughness:0.15});
  const glass=new THREE.MeshPhysicalMaterial({color:0x253f4b,metalness:0.3,roughness:0.12});
  const trim=new THREE.MeshStandardMaterial({color:0x182029,roughness:0.6});
  const chrome=new THREE.MeshStandardMaterial({color:0xb8c3c9,metalness:0.85,roughness:0.2});
  const box=(w:number,h:number,d:number,x:number,y:number,z:number,material:THREE.Material,radius=0.08)=> {
    const m=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,2,radius),material); m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; body.add(m); return m;
  };
  box(1.88,0.56,4.25,0,0.82,0,paint,0.16);
  box(1.64,0.58,1.98,0,1.32,-0.22,glass,0.18);
  box(1.64,0.12,1.65,0,1.64,-0.28,paint);
  box(1.7,0.09,1.2,0,1.11,1.26,paint);
  box(1.75,0.14,0.12,0,0.65,2.13,trim);
  box(1.75,0.14,0.12,0,0.65,-2.13,trim);
  box(0.88,0.18,0.04,0,0.87,2.15,trim);
  for(const side of [-1,1]) {
    box(0.06,0.47,0.09,side*0.82,1.33,-0.15,paint,0.02);
    box(0.17,0.16,0.3,side*1.03,1.22,0.54,paint,0.04);
    box(0.06,0.05,0.2,side*0.96,1.04,-0.22,chrome,0.02);
    box(0.05,0.15,3.2,side*0.94,0.6,0,trim,0.02);
  }
  const lamps=new THREE.MeshStandardMaterial({color:0xffffd9,emissive:0xffedbb,emissiveIntensity:1.3});
  const brakes=new THREE.MeshStandardMaterial({color:0xb51e27,emissive:0xff1523,emissiveIntensity:0.25});
  const beams: THREE.SpotLight[]=[];
  for(const side of [-1,1]) {
    box(0.47,0.14,0.06,side*0.6,0.98,2.12,lamps,0.025);
    box(0.53,0.13,0.06,side*0.6,0.98,-2.12,brakes,0.025);
    const light=new THREE.SpotLight(0xfff3d6,40,95,0.33,0.65,1.5);
    light.position.set(side*0.6,1,2); light.target.position.set(side*0.6,0,35); root.add(light,light.target); beams.push(light);
  }
  const wheels: { pivot: THREE.Group; spin: THREE.Group; front: boolean }[]=[];
  for(const x of [-0.94,0.94]) for(const z of [-1.36,1.36]) {
    const pivot=new THREE.Group(), spin=new THREE.Group(); pivot.position.set(x,0.46,z); pivot.add(spin); root.add(pivot);
    const tire=new THREE.Mesh(new THREE.CylinderGeometry(0.39,0.39,0.27,24),trim); tire.rotation.z=Math.PI/2; tire.castShadow=true; spin.add(tire);
    const rim=new THREE.Mesh(new THREE.CylinderGeometry(0.26,0.26,0.285,12),chrome); rim.rotation.z=Math.PI/2; spin.add(rim);
    const hub=new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.09,0.30,12),trim); hub.rotation.z=Math.PI/2; spin.add(hub);
    wheels.push({pivot,spin,front:z>0});
  }
  return {root,animate(state,dt,slope,night) {
    root.rotation.set(-Math.atan(slope),state.heading,0,'YXZ');
    body.rotation.z=THREE.MathUtils.damp(body.rotation.z,-state.steering*state.speed*0.0015,5,dt);
    body.rotation.x=THREE.MathUtils.damp(body.rotation.x,state.acceleration*0.004,5,dt);
    for(const wheel of wheels) { wheel.spin.rotation.x+=state.speed*dt/0.39; wheel.pivot.rotation.y=wheel.front?state.steering*0.4/(1+state.speed*0.045):0; }
    brakes.emissiveIntensity=state.acceleration < -2 ? 3 : 0.25;
    for(const light of beams) light.intensity=night?55:0;
  }};
}
