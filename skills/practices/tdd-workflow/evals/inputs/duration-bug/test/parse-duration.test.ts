import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseDuration } from '../src/parse-duration.ts';

describe('parseDuration', () => {
  it('parses hours and minutes', () => {
    assert.equal(parseDuration('1h30m'), 5400);
  });

  it('parses minutes only', () => {
    assert.equal(parseDuration('45m'), 2700);
  });
});
