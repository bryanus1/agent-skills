// Stand-in for a third-party SDK. Do not edit: in the real project it lives in node_modules.
export const outbox: { recipient: string; title: string; htmlBody: string }[] = [];

export class MailClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendEmail(message: { recipient: string; title: string; htmlBody: string }): Promise<{ messageId: string }> {
    if (!this.apiKey) throw new Error('missing api key');
    outbox.push(message);
    return { messageId: 'm' + outbox.length };
  }
}
