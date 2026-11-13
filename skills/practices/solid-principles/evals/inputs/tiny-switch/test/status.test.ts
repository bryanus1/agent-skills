import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { statusLabel } from '../src/status.ts';

describe('statusLabel', () => {
  it('maps every status to a Spanish label', () => {
    assert.equal(statusLabel('pending'), 'Pendiente');
    assert.equal(statusLabel('paid'), 'Pagado');
    assert.equal(statusLabel('shipped'), 'Enviado');
  });
});
