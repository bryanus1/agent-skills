import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { OrderService } from '../src/order-service.ts';
import { rows, resetDb } from '../src/db.ts';
import { sent, resetMailer } from '../src/mailer.ts';

const items = [{ sku: 'a', price: 50, qty: 2 }];

describe('OrderService.checkout', () => {
  beforeEach(() => { resetDb(); resetMailer(); });

  it('applies tax for Spain', () => {
    const result = new OrderService().checkout({ email: 'a@x.com', items, country: 'ES' });
    assert.equal(result.total, 121);
  });

  it('applies coupons before tax', () => {
    const result = new OrderService().checkout({ email: 'a@x.com', items, coupon: 'VIP20', country: 'FR' });
    assert.equal(result.total, 96);
  });

  it('persists the order and emails the customer', () => {
    const result = new OrderService().checkout({ email: 'a@x.com', items, country: 'DE' });
    assert.deepEqual(rows, [{ id: result.id, email: 'a@x.com', total: 100 }]);
    assert.equal(sent.length, 1);
    assert.equal(sent[0].to, 'a@x.com');
  });

  it('rejects empty orders', () => {
    assert.throws(() => new OrderService().checkout({ email: 'a@x.com', items: [], country: 'ES' }), /empty/);
  });
});
