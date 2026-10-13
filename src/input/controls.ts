import type { DriveInput } from '../vehicle/physics';
export function hasManualInput(input: DriveInput): boolean {
  return input.throttle > 0 || input.brake > 0 || input.steer !== 0 || input.handbrake;
}
export function createControls(onAction:(action:string)=>void) {
  const keys=new Set<string>(), touch=new Set<string>();
  const bindings: Record<string,string>={throttle:'KeyW',brake:'KeyS',left:'KeyA',right:'KeyD'};
  let remapping:string|null=null;
  const isEditing=(target:EventTarget|null)=>target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextArea;
  window.addEventListener('keydown',event=> {
    if(isEditing(event.target)) return;
    if(remapping) { bindings[remapping]=event.code; remapping=null; onAction('mapped'); event.preventDefault(); return; }
    const drivingKey=Object.values(bindings).includes(event.code)||['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(event.code);
    if(drivingKey) event.preventDefault();
    keys.add(event.code);
    if(event.repeat) return;
    if(event.code==='Escape') onAction('pause');
    if(event.code==='KeyC') onAction('camera');
    if(event.code==='KeyR') onAction('reset');
    if(event.code==='KeyP') onAction('autodrive');
  });
  window.addEventListener('keyup',event=>keys.delete(event.code));
  window.addEventListener('blur',()=> { keys.clear(); touch.clear(); onAction('blur'); });
  document.addEventListener('visibilitychange',()=> { if(document.hidden) {keys.clear();touch.clear();onAction('blur');} });
  for(const button of document.querySelectorAll<HTMLButtonElement>('[data-drive]')) {
    const action=button.dataset.drive!;
    button.addEventListener('pointerdown',event=> {event.preventDefault();button.setPointerCapture(event.pointerId);touch.add(action);});
    const release=()=>touch.delete(action);
    button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
  }
  const down=(action:string,arrow:string)=>keys.has(bindings[action])||keys.has(arrow)||touch.has(action);
  return {
    sample():DriveInput {return {throttle:down('throttle','ArrowUp')?1:0,brake:down('brake','ArrowDown')?1:0,steer:(down('left','ArrowLeft')?-1:0)+(down('right','ArrowRight')?1:0),handbrake:keys.has('Space')};},
    remap(action:string):void {if(action in bindings) {remapping=action;keys.clear();onAction('remapping');}},
    clear():void {keys.clear();touch.clear();}
  };
}
