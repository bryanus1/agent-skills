import type { Order } from './order.ts';

export function carrierLabel(order: Order): string {
  switch (order.carrier) {
    case 'standard':
      return 'Estándar';
    case 'express':
      return 'Exprés';
    case 'pickup':
      return 'Recogida en tienda';
  }
}
