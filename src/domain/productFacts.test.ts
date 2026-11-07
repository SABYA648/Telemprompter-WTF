import { describe, expect, it } from 'vitest';
import { CORE_PILLARS, PRODUCT_NAME, POSITIONING_STATEMENT } from './productFacts';
describe('product facts', () => {
  it('defines the product and creator positioning', () => {
    expect(PRODUCT_NAME).toBe('teleprompter.wtf');
    expect(POSITIONING_STATEMENT).toContain('No upload');
    expect(CORE_PILLARS.length).toBeGreaterThan(0);
  });
});
