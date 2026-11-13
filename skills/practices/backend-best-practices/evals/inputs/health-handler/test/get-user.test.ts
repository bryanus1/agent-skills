import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getUser } from '../src/get-user.ts';

const store = {
  async findById(id: string) {
    return id === 'u1' ? { id: 'u1', name: 'Ana' } : null;
  },
};

test('devuelve el usuario propio', async () => {
  assert.deepEqual((await getUser(store, 'u1', 'u1')).body, { id: 'u1', name: 'Ana' });
});

test('401 sin sesión, 400 con id inválido, 403 con otro usuario, 404 si no existe', async () => {
  assert.equal((await getUser(store, undefined, 'u1')).status, 401);
  assert.equal((await getUser(store, 'u1', 'x y')).status, 400);
  assert.equal((await getUser(store, 'u2', 'u1')).status, 403);
  assert.equal((await getUser(store, 'u9', 'u9')).status, 404);
});
