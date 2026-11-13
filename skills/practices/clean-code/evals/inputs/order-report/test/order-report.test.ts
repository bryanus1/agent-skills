import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { report, type Ord } from '../src/order-report.ts';

const orders: Ord[] = [
  { id: 'a', country: 'ES', st: 2, createdAt: '2026-03-10T10:00:00Z', lines: [{ sku: 'x', price: 10, qty: 2, cat: 'toys' }] },
  { id: 'b', country: 'FR', st: 1, createdAt: '2026-03-12T10:00:00Z', lines: [{ sku: 'y', price: 20, qty: 1, cat: 'books' }, { sku: 'z', price: 5, qty: 0, cat: 'toys' }] },
  { id: 'c', country: 'ES', st: 4, createdAt: '2026-03-15T10:00:00Z', lines: [{ sku: 'x', price: 99, qty: 1, cat: 'toys' }] },
  { id: 'd', country: 'ES', st: 3, createdAt: '2026-04-01T10:00:00Z', lines: [{ sku: 'x', price: 10, qty: 1, cat: 'toys' }] },
];

describe('report', () => {
  it('includes non-cancelled orders of the month with taxes', () => {
    const result = report(orders, 3, 2026, false, 'EUR');
    assert.deepEqual(result.rows, [{ id: 'a', total: 24.2 }, { id: 'b', total: 20.8 }]);
    assert.equal(result.total, 45);
  });

  it('adds status labels when requested', () => {
    const result = report(orders, 3, 2026, true, 'EUR');
    assert.deepEqual(result.rows.map((r) => r.label), ['paid', 'pending']);
  });

  it('formats the total in the given currency', () => {
    assert.match(report(orders, 3, 2026, false, 'EUR').formatted, /45,00\s€/);
  });

  it('returns an empty formatted value for an invalid currency', () => {
    assert.equal(report(orders, 3, 2026, false, 'NOPE!').formatted, '');
  });
});
