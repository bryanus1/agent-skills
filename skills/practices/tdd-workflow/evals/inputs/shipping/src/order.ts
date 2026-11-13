export type Zone = 'mainland' | 'islands' | 'remote';

export interface OrderItem {
  sku: string;
  price: number;
  qty: number;
  weightKg: number;
}

export interface Order {
  items: OrderItem[];
  zone: Zone;
}
