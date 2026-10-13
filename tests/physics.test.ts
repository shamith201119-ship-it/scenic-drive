import { describe, it, expect } from 'vitest';
import { createVehicle, stepVehicle } from '../src/vehicle/physics';
const input = { throttle: 1, brake: 0, steer: 0, handbrake: false };
describe('vehicle simulation', () => {
  it('accelerates and brakes without reversing', () => {
    const car = createVehicle();
    for (let i = 0; i < 600; i++) stepVehicle(car, input, 1/120, false);
    expect(car.speed).toBeGreaterThan(10);
    const speed = car.speed;
    for (let i = 0; i < 600; i++) stepVehicle(car, { ...input, throttle: 0, brake: 1 }, 1/120, false);
    expect(car.speed).toBeLessThan(speed);
    expect(car.speed).toBeGreaterThanOrEqual(0);
  });
  it('rejects invalid time steps', () => {
    for (const dt of [NaN, -1, Infinity, 0.10001]) {
      expect(() => stepVehicle(createVehicle(), input, dt, false)).toThrow(RangeError);
    }
  });
  it('does not turn when stationary', () => {
    const car = createVehicle(), heading = car.heading;
    stepVehicle(car, { ...input, throttle: 0, steer: 1 }, 1/120, false);
    expect(car.heading).toBe(heading);
  });
  it('keeps long simulations finite and wet grip lower', () => {
    const dry = createVehicle(), wet = createVehicle();
    for (let i = 0; i < 10000; i++) {
      stepVehicle(dry, input, 1/120, false);
      stepVehicle(wet, input, 1/120, true);
    }
    expect(Object.values(dry).every(Number.isFinite)).toBe(true);
    expect(dry.speed).toBeLessThanOrEqual(62);
    expect(wet.speed).toBeLessThan(dry.speed);
  });
  it('replays identical inputs deterministically', () => {
    const a = createVehicle(300), b = createVehicle(300);
    for (let i = 0; i < 1200; i++) {
      const command = { throttle: 0.8, brake: i > 900 ? 0.3 : 0, steer: Math.sin(i / 90) * 0.4, handbrake: false };
      stepVehicle(a, command, 1/120, false);
      stepVehicle(b, command, 1/120, false);
    }
    expect(a).toEqual(b);
  });
  it('clamps finite control values to their supported ranges', () => {
    const a = createVehicle(), b = createVehicle();
    stepVehicle(a, { throttle: 5, brake: -2, steer: 8, handbrake: false }, 1/120, false);
    stepVehicle(b, { throttle: 1, brake: 0, steer: 1, handbrake: false }, 1/120, false);
    expect(a).toEqual(b);
  });
  it('applies stronger resistance off the road', () => {
    const road = createVehicle(), grass = createVehicle();
    road.speed = grass.speed = 20;
    grass.x += 40;
    const coast = { throttle: 0, brake: 0, steer: 0, handbrake: false };
    stepVehicle(road, coast, 1/120, false);
    stepVehicle(grass, coast, 1/120, false);
    expect(grass.speed).toBeLessThan(road.speed);
  });
  it('handbrake reduces speed more than coasting', () => {
    const coast = createVehicle(), brake = createVehicle();
    coast.speed = brake.speed = 20;
    stepVehicle(coast, { ...input, throttle: 0 }, 1/120, false);
    stepVehicle(brake, { ...input, throttle: 0, handbrake: true }, 1/120, false);
    expect(brake.speed).toBeLessThan(coast.speed);
  });
  it('supports a zero duration step without moving', () => {
    const car = createVehicle();
    car.speed = 10;
    const before = { ...car };
    stepVehicle(car, input, 0, false);
    expect(car).toEqual(before);
  });
});
