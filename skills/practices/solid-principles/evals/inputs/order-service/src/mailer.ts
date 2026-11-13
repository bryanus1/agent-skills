export const sent: { to: string; subject: string; text: string }[] = [];

export function sendMail(to: string, subject: string, text: string): void {
  sent.push({ to, subject, text });
}

export function resetMailer(): void {
  sent.length = 0;
}
