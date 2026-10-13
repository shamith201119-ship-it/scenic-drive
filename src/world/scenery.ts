import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CHUNK_LENGTH, seededRandom, roadAt, type Biome } from './road';
import { terrainHeight } from './terrain';
function treeGeometry(conifer: boolean, desert: boolean): THREE.BufferGeometry {
  const pieces: THREE.BufferGeometry[] = [];
  const random=seededRandom(conifer?321:654);
  const add=(geometry:THREE.BufferGeometry,color:number,x:number,y:number,z:number)=> {
    geometry.translate(x,y,z);
    const base=new THREE.Color(color), colors:number[]=[];
    for(let i=0;i<geometry.getAttribute('position').count;i++) {
      const shade=0.88+random()*0.22;
      colors.push(base.r*shade,base.g*shade,base.b*shade);
    }
    geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    // Every piece must have matching attributes for merging.
    geometry.deleteAttribute('uv'); pieces.push(geometry);
  };
  add(new THREE.CylinderGeometry(0.10,0.30,desert?3:5,9),0x76614b,0,desert?1.5:2.5,0);
  if(desert) {
    for(let i=0;i<7;i++) {
      const angle=i/7*Math.PI*2;
      const leaf=new THREE.SphereGeometry(1,10,6);leaf.scale(2.2,0.22,0.68);leaf.rotateY(angle);leaf.rotateZ(0.22);
      add(leaf,0x668247,Math.cos(angle)*0.9,3.4,Math.sin(angle)*0.9);
    }
  } else if(conifer) {
    for(let tier=0;tier<5;tier++) {
      const radius=2.15-tier*0.33;
      const crown=new THREE.ConeGeometry(radius,2.8,14,3);
      const positions=crown.getAttribute('position');
      for(let i=0;i<positions.count;i++) {
        const x=positions.getX(i),z=positions.getZ(i);
        const ripple=1+0.12*Math.sin(Math.atan2(z,x)*7+tier);
        positions.setXYZ(i,x*ripple,positions.getY(i),z*ripple);
      }
      crown.computeVertexNormals();
      add(crown,tier%2?0x426743:0x345c3c,0,2.8+tier*1.15,0);
    }
  } else {
    // Clustered crowns, not a single primitive silhouette.
    for(let i=0;i<9;i++) {
      const angle=i*2.39996;
      const radius=i===0?0:1.4+random()*0.45;
      const crown=new THREE.SphereGeometry(1,12,9);
      crown.scale(1.45+random()*0.5,1.15+random()*0.5,1.4+random()*0.5);
      add(crown,[0x597843,0x456e3b,0x75904e][i%3],Math.cos(angle)*radius,4.7+random()*2,Math.sin(angle)*radius);
    }
  }
  const merged=mergeGeometries(pieces,false);
  pieces.forEach(piece=>piece.dispose());
  if(!merged) throw new Error('Unable to merge procedural tree geometry');
  merged.computeBoundingSphere();return merged;
}
export function makeScenery(index: number, biome: Biome, density: number): THREE.Group {
  const group=new THREE.Group(),random=seededRandom(index*193+731);
  const count=Math.floor(density*(biome==='desert'?0.28:1));
  const conifer=biome==='alpine';
  const trees=new THREE.InstancedMesh(treeGeometry(conifer,biome==='desert'),new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.95}),count);
  trees.name='layered-vegetation';
  const dummy=new THREE.Object3D(),tint=new THREE.Color();
  for(let i=0;i<count;i++) {
    const z=(index+random())*CHUNK_LENGTH;
    // Concentrate a varied treeline near the road rather than oversized cones everywhere.
    const distance=16+Math.pow(random(),1.7)*280;
    const x=roadAt(z).x+(random()<0.5?-1:1)*distance;
    const scale=0.65+random()*0.8;
    dummy.position.set(x,terrainHeight(x,z),z);
    dummy.scale.set(scale*(0.85+random()*0.25),scale,scale);
    dummy.rotation.set(0,random()*Math.PI*2,(random()-0.5)*0.06);dummy.updateMatrix();trees.setMatrixAt(i,dummy.matrix);
    tint.setHSL(0.22+random()*0.035,0.12+random()*0.12,0.69+random()*0.22);trees.setColorAt(i,tint);
  }
  const rocks=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),new THREE.MeshStandardMaterial({color:biome==='desert'?0xad936c:0x858b80,roughness:1}),32);
  rocks.name='rock-formations';
  for(let i=0;i<32;i++) {
    const z=(index+random())*CHUNK_LENGTH,x=roadAt(z).x+(random()<0.5?-1:1)*(10+random()*150);
    dummy.position.set(x,terrainHeight(x,z)+0.25,z);dummy.scale.set(0.6+random()*2.5,0.4+random()*1.3,0.7+random()*2);
    dummy.rotation.set(random(),random()*6,random());dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix);
  }
  const shrubCount=Math.floor(density*0.8);
  const shrubs=new THREE.InstancedMesh(new THREE.SphereGeometry(1,8,6),new THREE.MeshStandardMaterial({color:biome==='desert'?0x9b9a65:0x657b47,roughness:1}),shrubCount);
  shrubs.name='roadside-shrubs';
  for(let i=0;i<shrubCount;i++) {
    const z=(index+random())*CHUNK_LENGTH,x=roadAt(z).x+(random()<0.5?-1:1)*(7.5+random()*40);
    const scale=0.35+random()*0.7;
    dummy.position.set(x,terrainHeight(x,z)+scale*0.25,z);dummy.scale.set(scale,scale*0.55,scale);dummy.rotation.set(0,random()*6,0);dummy.updateMatrix();shrubs.setMatrixAt(i,dummy.matrix);
  }
  for(const mesh of [trees,rocks,shrubs]) {
    mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor) mesh.instanceColor.needsUpdate=true;
    mesh.computeBoundingSphere();mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
  }
  return group;
}
