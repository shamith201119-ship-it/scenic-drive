import type { Quality } from '../world/chunks';
import type { Weather, TimeOfDay } from '../rendering/renderer';
export function element<T extends HTMLElement>(id:string):T {
  const node=document.getElementById(id);if(!node) throw new Error(`Missing interface element: ${id}`);return node as T;
}
export function createInterface(callbacks:{action:(action:string)=>void;quality:(quality:Quality)=>void;environment:(weather:Weather,time:TimeOfDay)=>void;route:(z:number)=>void;audio:(enabled:boolean)=>void;autodrive:(enabled:boolean)=>void;remap:(action:string)=>void}) {
  const menu=element('menu'),start=element<HTMLButtonElement>('start'),message=element('message');
  for(const id of ['pause','camera','reset']) element(id).addEventListener('click',()=>callbacks.action(id));
  start.addEventListener('click',()=>callbacks.action('start'));
  element<HTMLSelectElement>('quality').addEventListener('change',event=>callbacks.quality((event.target as HTMLSelectElement).value as Quality));
  const weather=element<HTMLSelectElement>('weather'),time=element<HTMLSelectElement>('time');
  const environment=()=>callbacks.environment(weather.value as Weather,time.value as TimeOfDay);
  weather.addEventListener('change',environment);time.addEventListener('change',environment);
  element<HTMLSelectElement>('route').addEventListener('change',event=>callbacks.route(Number((event.target as HTMLSelectElement).value)));
  element<HTMLInputElement>('audio').addEventListener('change',event=>callbacks.audio((event.target as HTMLInputElement).checked));
  element<HTMLInputElement>('autodrive').addEventListener('change',event=>callbacks.autodrive((event.target as HTMLInputElement).checked));
  for(const button of document.querySelectorAll<HTMLButtonElement>('[data-remap]')) button.addEventListener('click',()=>callbacks.remap(button.dataset.remap!));
  const speed=element('speed'),distance=element('distance'),biome=element('biome'),status=element('status'),diagnostics=element('diagnostics');
  return {
    pause(paused:boolean,started:boolean):void {menu.hidden=!paused;document.body.classList.toggle('paused',paused);start.textContent=started?'RESUME DRIVING →':'START DRIVING →';},
    message(text:string):void {message.textContent=text;},
    update(data:{speed:number;distance:number;biome:string;camera:string;autodrive:boolean;fps:number;chunks:number;calls:number}):void {
      speed.textContent=String(Math.round(data.speed*3.6));distance.textContent=`${(data.distance/1000).toFixed(2)} KM`;biome.textContent=`${data.biome.toUpperCase()} ROUTE`;status.textContent=`${data.autodrive?'AUTOPILOT':'MANUAL'} · ${data.camera.toUpperCase()}`;
      diagnostics.textContent=`${Math.round(data.fps)} FPS · ${data.chunks} CHUNKS · ${data.calls} DRAW CALLS`;
      element<HTMLInputElement>('autodrive').checked=data.autodrive;
    }
  };
}
