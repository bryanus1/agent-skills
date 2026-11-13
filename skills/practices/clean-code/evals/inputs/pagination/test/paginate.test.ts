import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { paginate } from '../src/paginate.ts';

const items = Array.from({ length: 25 }, (_, i) => i + 1);

describe('paginate', () => {
  it('returns the first page by default', () => {
    const result = paginate(items, undefined, undefined);
    assert.deepEqual(result.data, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    assert.equal(result.hasNext, true);
    assert.equal(result.hasPrev, false);
  });

  it('returns the last page', () => {
    const result = paginate(items, 3, 10);
    assert.deepEqual(result.data, [21, 22, 23, 24, 25]);
    assert.equal(result.totalPages, 3);
    assert.equal(result.hasNext, false);
  });
});
