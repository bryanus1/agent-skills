import { MailClient } from './vendor/mail-sdk.ts';

export interface ShippedOrder {
  id: string;
  customerEmail: string;
  trackingCode: string;
}

export async function notifyShipped(order: ShippedOrder): Promise<void> {
  const client = new MailClient(process.env.MAIL_API_KEY ?? 'dev-key');
  await client.sendEmail({
    recipient: order.customerEmail,
    title: 'Tu pedido ' + order.id + ' ha sido enviado',
    htmlBody: '<p>Código de seguimiento: <b>' + order.trackingCode + '</b></p>',
  });
}
