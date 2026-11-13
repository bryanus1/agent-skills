export interface CartLine {
  sku: string;
  unitPrice: number;
  qty: number;
}

export interface CartRepository {
  get(cartId: string): Promise<CartLine[]>;
}

export class CartService {
  private readonly carts: CartRepository;

  constructor(carts: CartRepository) {
    this.carts = carts;
  }

  async total(cartId: string): Promise<number> {
    const lines = await this.carts.get(cartId);
    return lines.reduce((sum, line) => sum + line.unitPrice * line.qty, 0);
  }
}
