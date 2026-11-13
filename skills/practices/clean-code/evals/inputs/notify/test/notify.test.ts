import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sendWelcomeEmail, sendPasswordResetEmail, type Mailer } from '../src/notify.ts';

function fakeMailer() {
  const sent: Parameters<Mailer['send']>[0][] = [];
  const mailer: Mailer = { send: async (message) => { sent.push(message); } };
  return { mailer, sent };
}

const user = { email: 'ana@example.com', name: 'Ana' };

describe('notify', () => {
  it('sends the welcome email', async () => {
    const { mailer, sent } = fakeMailer();
    await sendWelcomeEmail(mailer, user);
    assert.deepEqual(sent, [{ to: 'ana@example.com', subject: 'Bienvenido, Ana', body: 'Hola Ana,\n\nGracias por registrarte.' }]);
  });

  it('sends the password reset email', async () => {
    const { mailer, sent } = fakeMailer();
    await sendPasswordResetEmail(mailer, user, 'abc');
    assert.equal(sent[0].subject, 'Restablece tu contraseña');
    assert.match(sent[0].body, /token=abc$/);
  });
});
