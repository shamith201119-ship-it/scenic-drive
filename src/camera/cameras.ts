import * as THREE from 'three';
export function createCameras(camera:THREE.PerspectiveCamera) {
  const names=['Chase','Hood','Orbit']; let mode=0,initialized=false;
  const desired=new THREE.Vector3(), look=new THREE.Vector3(), targetLook=new THREE.Vector3();
  return {
    cycle():string {mode=(mode+1)%3;initialized=false;return names[mode];},
    reset():void {initialized=false;},
    update(position:THREE.Vector3,heading:number,speed:number,dt:number,elapsed:number):void {
      const forward=new THREE.Vector3(Math.sin(heading),0,Math.cos(heading));
      desired.copy(position);
      if(mode===0) desired.addScaledVector(forward,-8-speed*0.035).add(new THREE.Vector3(0,3.7,0));
      else if(mode===1) desired.addScaledVector(forward,1.65).add(new THREE.Vector3(0,1.42,0));
      else desired.add(new THREE.Vector3(Math.sin(elapsed*0.16)*10,4.5,Math.cos(elapsed*0.16)*10));
      targetLook.copy(position).add(new THREE.Vector3(0,1,0)).addScaledVector(forward,mode===2?0:mode===1?35:8);
      const alpha=initialized?1-Math.exp(-dt*(mode===1?18:5)):1;
      camera.position.lerp(desired,alpha); look.lerp(targetLook,alpha); camera.lookAt(look);
      camera.fov=THREE.MathUtils.damp(camera.fov,mode===1?70:62+Math.min(8,speed*0.15),3,dt);camera.updateProjectionMatrix();initialized=true;
    }
  };
}
