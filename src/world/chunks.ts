import * as THREE from 'three';
import { biomeAt, CHUNK_LENGTH, roadAt } from './road';
import { makeTerrain } from './terrain';
import { makeScenery } from './scenery';
export type Quality = 'low' | 'medium' | 'high';
export const qualitySettings = { low: { radius: 3, detail: 16, trees: 45, ratio: 1 }, medium: { radius: 5, detail: 24, trees: 100, ratio: 1.5 }, high: { radius: 7, detail: 32, trees: 180, ratio: 2 } };
function strip(index: number, left: number, right: number, lift: number, color: number): THREE.Mesh {
  const p: number[] = [], ids: number[] = [];
  for (let j = 0; j <= 80; j++) {
    const z = index * CHUNK_LENGTH + j * 2, r = roadAt(z);
    p.push(r.x + left, r.y + lift, z, r.x + right, r.y + lift, z);
    if (j < 80) { const a = j*2; ids.push(a,a+2,a+1,a+1,a+2,a+3); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p,3)); g.setIndex(ids); g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color, roughness: color === 0x343940 ? 0.88 : 0.65 })); m.receiveShadow = true; return m;
}
function roadObjects(index: number): THREE.Group {
  const group = new THREE.Group();
  group.add(strip(index,-5.5,5.5,-0.015,0x9e927d), strip(index,-4.5,4.5,0,0x343940));
  group.add(strip(index,-4.12,-3.97,0.012,0xe9e6d8), strip(index,3.97,4.12,0.012,0xe9e6d8));
  const marks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.14,0.025,4),new THREE.MeshStandardMaterial({color:0xf4e9bb}),16);
  const posts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.13,1,0.16),new THREE.MeshStandardMaterial({color:0xe6e3d7}),16);
  const dummy = new THREE.Object3D();
  for (let i=0;i<16;i++) {
    const z = index*CHUNK_LENGTH+i*10+5, r=roadAt(z);
    dummy.position.set(r.x,r.y+0.018,z); dummy.rotation.set(-Math.atan(r.slope),r.heading,0); dummy.updateMatrix(); marks.setMatrixAt(i,dummy.matrix);
    const side = i%2===0 ? -1 : 1;
    dummy.position.set(r.x+side*5.8,r.y+0.45,z); dummy.rotation.set(0,0,0); dummy.updateMatrix(); posts.setMatrixAt(i,dummy.matrix);
  }
  marks.instanceMatrix.needsUpdate=true; posts.instanceMatrix.needsUpdate=true; marks.computeBoundingSphere(); posts.computeBoundingSphere(); group.add(marks,posts);
  return group;
}
export class ChunkWorld {
  readonly root = new THREE.Group();
  private chunks = new Map<number,THREE.Group>();
  private pending: number[] = [];
  private center = Number.NaN;
  quality: Quality;
  constructor(scene: THREE.Scene, quality: Quality) { this.quality=quality; scene.add(this.root); }
  setQuality(quality: Quality): void { this.quality=quality; this.clear(); this.center=Number.NaN; }
  update(z: number, origin: THREE.Vector3, bootstrap=false): void {
    const center=Math.floor(z/CHUNK_LENGTH), settings=qualitySettings[this.quality];
    if(center!==this.center) {
      this.center=center;
      for(const [id, chunk] of this.chunks) if(Math.abs(id-center)>settings.radius) { this.dispose(chunk); this.chunks.delete(id); }
      this.pending=[];
      for(let d=0;d<=settings.radius;d++) for(const id of d===0?[center]:[center+d,center-d]) if(!this.chunks.has(id)) this.pending.push(id);
    }
    // Build at most one chunk per frame after the initial corridor is ready.
    let budget=bootstrap?3:1;
    while(budget-->0 && this.pending.length) {
      const id=this.pending.shift()!;
      const chunk=new THREE.Group(), biome=biomeAt(id*CHUNK_LENGTH+80);
      chunk.add(makeTerrain(id,biome,settings.detail),roadObjects(id),makeScenery(id,biome,settings.trees));
      if(biome==='coastal') {
        const water=new THREE.Mesh(new THREE.PlaneGeometry(320,CHUNK_LENGTH),new THREE.MeshStandardMaterial({color:0x367c91,metalness:0.25,roughness:0.24}));
        water.rotation.x=-Math.PI/2; water.position.set(roadAt(id*CHUNK_LENGTH+80).x-290,4,id*CHUNK_LENGTH+80); chunk.add(water);
      }
      this.root.add(chunk); this.chunks.set(id,chunk);
    }
    this.root.position.copy(origin).multiplyScalar(-1);
  }
  get count(): number { return this.chunks.size; }
  private dispose(group: THREE.Group): void {
    this.root.remove(group);
    group.traverse(object=> { if(object instanceof THREE.Mesh) { object.geometry.dispose(); for(const m of Array.isArray(object.material)?object.material:[object.material]) m.dispose(); if(object instanceof THREE.InstancedMesh) object.dispose(); } });
  }
  clear(): void { for(const chunk of this.chunks.values()) this.dispose(chunk); this.chunks.clear(); this.pending=[]; }
}
