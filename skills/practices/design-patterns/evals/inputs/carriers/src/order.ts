export type Carrier = 'standard' | 'express' | 'pickup';

export interface Order {
  id: string;
  carrier: Carrier;
  weightKg: number;
}
