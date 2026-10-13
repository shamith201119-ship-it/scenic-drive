export function createEngineAudio() {
  let context:AudioContext|null=null, oscillator:OscillatorNode|null=null, engineGain:GainNode|null=null, windGain:GainNode|null=null, enabled=true;
  async function start():Promise<void> {
    if(!enabled) return;
    if(!context) {
      context=new AudioContext();
      const filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=380;
      engineGain=context.createGain();engineGain.gain.value=0;
      oscillator=context.createOscillator();oscillator.type='sawtooth';oscillator.frequency.value=35;
      oscillator.connect(filter).connect(engineGain).connect(context.destination);oscillator.start();
      const buffer=context.createBuffer(1,context.sampleRate*2,context.sampleRate),data=buffer.getChannelData(0);
      for(let i=0;i<data.length;i++) data[i]=Math.random()*2-1;
      const noise=context.createBufferSource();noise.buffer=buffer;noise.loop=true;
      const windFilter=context.createBiquadFilter();windFilter.type='lowpass';windFilter.frequency.value=800;
      windGain=context.createGain();windGain.gain.value=0;noise.connect(windFilter).connect(windGain).connect(context.destination);noise.start();
    }
    await context.resume();
  }
  function update(speed:number,throttle:number,paused:boolean,rain:boolean):void {
    if(!context || !oscillator || !engineGain || !windGain) return;
    const t=context.currentTime;
    oscillator.frequency.setTargetAtTime(32+(speed%13)*5+throttle*12,t,0.08);
    engineGain.gain.setTargetAtTime(enabled&&!paused?0.025+throttle*0.025:0,t,0.08);
    windGain.gain.setTargetAtTime(enabled&&!paused?Math.min(0.065,speed*0.001)+(rain?0.025:0):0,t,0.12);
  }
  return {start,update,setEnabled(value:boolean):void {enabled=value;if(enabled) void start().catch(()=>{});}};
}
