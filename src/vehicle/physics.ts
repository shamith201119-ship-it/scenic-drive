import { roadAt, ROAD_WIDTH } from '../world/road';
export interface VehicleState { x: number; z: number; speed: number; heading: number; steering: number; distance: number; acceleration: number }
export interface DriveInput { throttle: number; brake: number; steer: number; handbrake: boolean }
export function createVehicle(z = 0): VehicleState {
  const road = roadAt(z);
  return { x: road.x - 2, z, speed: 0, heading: road.heading, steering: 0, distance: 0, acceleration: 0 };
}
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
export function stepVehicle(car: VehicleState, input: DriveInput, dt: number, wet: boolean): void {
  if (!Number.isFinite(dt) || dt < 0 || dt > 0.1) throw new RangeError('Time step must be finite and between 0 and 0.1 seconds');
  const road = roadAt(car.z);
  const offroad = Math.abs(car.x - road.x) > ROAD_WIDTH / 2;
  const throttle = clamp(input.throttle, 0, 1), brake = clamp(input.brake, 0, 1);
  const grip = wet ? 0.68 : 1;
  car.steering += (clamp(input.steer, -1, 1) - car.steering) * (1 - Math.exp(-7 * dt));
  const oldSpeed = car.speed;
  const engine = 8.5 * throttle * (wet ? 0.85 : 1) / (1 + car.speed * 0.014);
  const drag = 0.28 + car.speed * car.speed * 0.0024 + (offroad ? 3 + car.speed * 0.13 : 0);
  car.speed = clamp(car.speed + (engine - drag - brake * 14 - (input.handbrake ? 17 : 0) - road.slope * 9.81) * dt, 0, 62);
  const angle = car.steering * 0.48 / (1 + car.speed * 0.045);
  const turn = car.speed / 2.7 * Math.tan(angle) * grip * (offroad ? 0.7 : 1);
  car.heading += turn * dt;
  car.x += Math.sin(car.heading) * car.speed * dt;
  car.z += Math.cos(car.heading) * car.speed * dt;
  car.distance += car.speed * dt;
  car.acceleration = dt > 0 ? (car.speed - oldSpeed) / dt : 0;
  // A forgiving corridor boundary prevents falling into unloaded terrain.
  const center = roadAt(car.z).x;
  if (Math.abs(car.x - center) > 180) {
    car.x = center + Math.sign(car.x - center) * 180;
    car.speed *= 0.65;
    car.heading = roadAt(car.z).heading;
  }
}
