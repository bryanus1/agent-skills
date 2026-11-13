import { useEffect, useState } from 'react';

interface Props {
  subtotal: number;
  discount: number;
  onCheckout: () => void;
}

export function CartSummary({ subtotal, discount, onCheckout }: Props) {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setTotal(subtotal - discount);
  }, [subtotal, discount]);

  return (
    <div>
      <p>Total: {total.toFixed(2)} €</p>
      <div onClick={onCheckout} style={{ cursor: 'pointer' }}>
        Pagar
      </div>
    </div>
  );
}
