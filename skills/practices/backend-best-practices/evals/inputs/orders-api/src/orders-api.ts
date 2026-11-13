import { db } from './db.ts';

export interface Req {
  user?: { id: string };
  params: Record<string, string>;
  query: Record<string, string>;
  body?: Record<string, unknown>;
}

export async function listOrders(req: Req) {
  const rows = await db.query(`SELECT * FROM orders WHERE status = '${req.query.status}'`);
  for (const order of rows) {
    order.items = (await db.query(`SELECT * FROM items WHERE order_id = '${order.id}'`)) as never;
  }
  return { status: 200, body: rows };
}

export async function getOrder(req: Req) {
  const [order] = await db.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
  if (!order) return { status: 404, body: { error: 'not found' } };
  return { status: 200, body: order };
}

export async function createOrder(req: Req) {
  try {
    const order = await db.insert('orders', { ...(req.body as Record<string, string>) });
    return { status: 200, body: order };
  } catch (err) {
    const e = err as Error;
    return { status: 200, body: { error: e.message, stack: e.stack } };
  }
}
