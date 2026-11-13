export interface Mailer {
  send(message: { to: string; subject: string; body: string }): Promise<void>;
}

export async function sendWelcomeEmail(mailer: Mailer, user: { email: string; name: string }) {
  const subject = 'Bienvenido, ' + user.name;
  const body = 'Hola ' + user.name + ',\n\nGracias por registrarte.';
  await mailer.send({ to: user.email, subject: subject, body: body });
}

export async function sendPasswordResetEmail(mailer: Mailer, user: { email: string; name: string }, token: string) {
  const subject = 'Restablece tu contraseña';
  const body = 'Hola ' + user.name + ',\n\nUsa este enlace: https://app.example.com/reset?token=' + token;
  await mailer.send({ to: user.email, subject: subject, body: body });
}
