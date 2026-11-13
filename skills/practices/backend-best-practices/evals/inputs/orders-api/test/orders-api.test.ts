import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createOrder, getOrder, listOrders } from '../src/orders-api.ts';

test('listOrders devuelve los pedidos con ese estado y sus items', async () => {
  const res = await listOrders({ params: {}, query: { status: 'paid' }, user: { id: 'u1' } });
  const ids = (res.body as { id: string }[]).map((o) => o.id).sort();
  assert.deepEqual(ids, ['o1', 'o2']);
  const first = (res.body as { id: string; items: unknown[] }[]).find((o) => o.id === 'o1');
  assert.equal(first?.items.length, 2);
});

test('getOrder devuelve el pedido pedido', async () => {
  const res = await getOrder({ params: { id: 'o1' }, query: {}, user: { id: 'u1' } });
  assert.equal((res.body as { id: string }).id, 'o1');
});

test('getOrder devuelve 404 si no existe', async () => {
  const res = await getOrder({ params: { id: 'nope' }, query: {}, user: { id: 'u1' } });
  assert.equal(res.status, 404);
});

test('createOrder crea un pedido', async () => {
  const res = await createOrder({ params: {}, query: {}, user: { id: 'u1' }, body: { user_id: 'u1', status: 'pending' } });
  assert.ok((res.body as { id?: string }).id);
});
