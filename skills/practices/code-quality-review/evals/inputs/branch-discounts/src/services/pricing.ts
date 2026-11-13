export interface Line {
  price: number;
  qty: number;
}

export interface Order {
  lines: Line[];
  coupon?: { code: string; percent: number; expired: boolean };
  loyaltyYears?: number;
}

export function computeTotal(order: Order): number {
  let total = 0;
  for (const line of order.lines) {
    total += line.price * line.qty;
  }
  if (order.coupon && !order.coupon.expired) {
    total = total - total * (order.coupon.percent / 100);
  }
  if (order.loyaltyYears && order.loyaltyYears >= 3) {
    total = total - total * 0.15;
  }
  return Math.round(total * 100) / 100;
}
