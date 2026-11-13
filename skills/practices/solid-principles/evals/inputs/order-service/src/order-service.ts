import { insertOrder } from './db.ts';
import { sendMail } from './mailer.ts';

export interface CheckoutInput {
  email: string;
  items: { sku: string; price: number; qty: number }[];
  coupon?: string;
  country: string;
}

export class OrderService {
  checkout(dto: CheckoutInput) {
    if (!dto.items.length) throw new Error('empty order');
    let total = 0;
    for (const i of dto.items) total += i.price * i.qty;
    if (dto.coupon === 'WELCOME10') total *= 0.9;
    else if (dto.coupon === 'VIP20') total *= 0.8;
    if (dto.country === 'ES') total *= 1.21;
    else if (dto.country === 'FR') total *= 1.2;
    total = Math.round(total * 100) / 100;
    const id = insertOrder(dto.email, total);
    sendMail(dto.email, 'Pedido ' + id, 'Total: ' + total);
    return { id, total };
  }
}
