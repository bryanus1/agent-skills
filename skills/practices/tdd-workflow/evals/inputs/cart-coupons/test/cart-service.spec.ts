import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CartService, type CartLine, type CartRepository } from '../src/cart-service.ts';

class InMemoryCartRepository implements CartRepository {
  private readonly carts: Record<string, CartLine[]>;
  constructor(carts: Record<string, CartLine[]> = {}) {
    this.carts = carts;
  }
  async get(cartId: string) {
    return this.carts[cartId] ?? [];
  }
}

describe('CartService.total', () => {
  it('sums unit price times quantity', async () => {
    const service = new CartService(new InMemoryCartRepository({ c1: [{ sku: 'a', unitPrice: 10, qty: 2 }] }));
    assert.equal(await service.total('c1'), 20);
  });
});
