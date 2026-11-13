import { db } from '../db.ts';
import { computeTotal } from '../services/pricing.ts';

export async function getOrderTotal(req: { query: { orderId: string; coupon?: string } }) {
  const lines = await db.query(`SELECT price, qty FROM order_lines WHERE order_id = '${req.query.orderId}'`);
  const coupons = req.query.coupon
    ? await db.query(`SELECT code, percent, expired FROM coupons WHERE code = '${req.query.coupon}'`)
    : [];
  const total = computeTotal({
    lines: lines as never,
    coupon: coupons[0] as never,
  });
  return { status: 200, body: { total } };
}
