import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryStorage, backup } from '../src/storage.ts';

describe('storage', () => {
  it('backs files up between storages', async () => {
    const a = new MemoryStorage();
    const b = new MemoryStorage();
    await a.save('x.txt', 'hello');
    await backup(a, b, ['x.txt']);
    assert.equal(await b.read('x.txt'), 'hello');
  });
});
