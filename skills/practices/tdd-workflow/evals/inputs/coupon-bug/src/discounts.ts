export const COUPONS = {
  BLACKFRIDAY: { percent: 20, minTotal: 100 },
  WELCOME10: { percent: 10, minTotal: 0 },
} as const;

export type CouponCode = keyof typeof COUPONS;

export function applyCoupon(total: number, code: CouponCode): number {
  const coupon = COUPONS[code];
  if (total > coupon.minTotal) {
    return Math.round(total * (1 - coupon.percent / 100) * 100) / 100;
  }
  return total;
}
