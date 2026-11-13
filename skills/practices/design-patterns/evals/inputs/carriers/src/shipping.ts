import type { Order } from './order.ts';

export function shippingCost(order: Order): number {
  switch (order.carrier) {
    case 'standard':
      return 4.99;
    case 'express':
      return 9.99 + order.weightKg * 2;
    case 'pickup':
      return 0;
  }
}
