export interface Sale {
  amount: number;
  refunded: boolean;
  seller: { id: string; tier: 'basic' | 'standard' | 'premium' };
}

export function commission(sale: Sale): number {
  if (sale.refunded) return 0;
  let rate = 0.05;
  if (sale.seller.tier === 'basic') rate = 0.03;
  if (sale.amount > 10000) rate += 0.01;
  return Math.round(sale.amount * rate * 100) / 100;
}
