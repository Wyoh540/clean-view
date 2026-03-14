import { describe, it, expect } from 'vitest';

describe('smoke', () => {
  it('given vitest is running when running a trivial assertion then it passes', () => {
    expect(1).toBe(1);
  });
});
