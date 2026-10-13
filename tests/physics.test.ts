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
    expect(() => stepVehicle(createVehicle(), input, NaN, false)).toThrow();
    expect(() => stepVehicle(createVehicle(), input, -1, false)).toThrow();
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
});
