import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { notifyShipped } from '../src/notifier.ts';
import { outbox } from '../src/vendor/mail-sdk.ts';

describe('notifyShipped', () => {
  it('emails the tracking code to the customer', async () => {
    await notifyShipped({ id: 'o7', customerEmail: 'ana@example.com', trackingCode: 'TRK123' });
    assert.equal(outbox.length, 1);
    assert.equal(outbox[0].recipient, 'ana@example.com');
    assert.match(outbox[0].title, /o7/);
    assert.match(outbox[0].htmlBody, /TRK123/);
  });
});
