import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { shippingCost } from '../src/shipping.ts';
import { etaDays } from '../src/eta.ts';
import { carrierLabel } from '../src/labels.ts';
import type { Order } from '../src/order.ts';

const order = (carrier: Order['carrier'], weightKg = 3): Order => ({ id: 'o1', carrier, weightKg });

describe('carriers', () => {
  it('computes shipping cost', () => {
    assert.equal(shippingCost(order('standard')), 4.99);
    assert.equal(shippingCost(order('express')), 15.99);
    assert.equal(shippingCost(order('pickup')), 0);
  });

  it('computes delivery estimate', () => {
    assert.equal(etaDays(order('standard')), 5);
    assert.equal(etaDays(order('express')), 1);
    assert.equal(etaDays(order('pickup')), 2);
  });

  it('labels carriers', () => {
    assert.equal(carrierLabel(order('express')), 'Exprés');
    assert.equal(carrierLabel(order('pickup')), 'Recogida en tienda');
  });
});
