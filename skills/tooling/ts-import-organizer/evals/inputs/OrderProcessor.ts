import { processPayment, calculateTax, validateCart, applyDiscount } from '../../../modules/checkout/services'
import { CartItem } from '../../../types/cart'
import { useState } from 'react'
import { formatCurrency } from '../../utils/currency'
import { useEffect } from 'react'
import 'reflect-metadata'

export function OrderProcessor({ items }: { items: CartItem[] }) {
const [total, setTotal] = useState(0)
useEffect(() => {
const tax = calculateTax(items)
setTotal(tax)
}, [items])
return total
}
