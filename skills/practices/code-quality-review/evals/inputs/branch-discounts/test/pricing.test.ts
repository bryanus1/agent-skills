import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeTotal } from '../src/services/pricing.ts';

test('suma las líneas', () => {
  assert.equal(computeTotal({ lines: [{ price: 10, qty: 2 }, { price: 5, qty: 1 }] }), 25);
});

test('un pedido vacío vale 0', () => {
  assert.equal(computeTotal({ lines: [] }), 0);
});

test('redondea a dos decimales', () => {
  assert.equal(computeTotal({ lines: [{ price: 0.1, qty: 3 }] }), 0.3);
});
