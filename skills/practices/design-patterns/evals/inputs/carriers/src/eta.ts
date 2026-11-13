import type { Order } from './order.ts';

export function etaDays(order: Order): number {
  switch (order.carrier) {
    case 'standard':
      return 5;
    case 'express':
      return 1;
    case 'pickup':
      return 2;
  }
}
