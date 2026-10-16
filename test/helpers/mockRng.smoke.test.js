import { describe, expect, test } from 'vitest';
import { MockRNG } from '../helpers/mockRng.js';

// Smoke: prove Vitest + MockRNG wiring works before Level 1 agent tests.
// TODO: fill in the expects (hand values from seq [0.1, 0.9, 0.5])
describe('MockRNG smoke', () => {
  test('plays back scripted uniforms and int', () => {
    const r = new MockRNG([0.1, 0.9, 0.5]);
    expect(r.uniform()).toBe(0.1);
    expect(r.uniform()).toBe(0.9);
    expect(r.int(4)).toBe(2);  // floor(0.5 * 4)
  });
});
