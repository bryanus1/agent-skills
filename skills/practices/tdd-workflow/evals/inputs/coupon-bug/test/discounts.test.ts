import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyCoupon } from '../src/discounts.ts';

describe('applyCoupon', () => {
  it('applies BLACKFRIDAY above the minimum', () => {
    assert.equal(applyCoupon(150, 'BLACKFRIDAY'), 120);
  });

  it('does not apply BLACKFRIDAY below the minimum', () => {
    assert.equal(applyCoupon(80, 'BLACKFRIDAY'), 80);
  });

  it('applies WELCOME10 to any total', () => {
    assert.equal(applyCoupon(50, 'WELCOME10'), 45);
  });
});
