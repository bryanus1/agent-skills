export interface InvoiceLine { desc: string; qty: number; price: number; vat: number }

export function calcTotals(lines: InvoiceLine[]) {
  let n = 0, v = 0;
  for (const l of lines) { n += l.qty * l.price; v += l.qty * l.price * l.vat }
  return { net: Math.round(n * 100) / 100, vat: Math.round(v * 100) / 100, gross: Math.round((n + v) * 100) / 100 };
}

export function formatInvoiceLine(l: InvoiceLine, w: number, c: string, showVat: boolean) {
  let s = '';
  let d = l.desc;
  if (d.length > w - 20) { d = d.substring(0, w - 23) + '...' } else { while (d.length < w - 20) { d = d + ' ' } }
  s = s + d;
  let q = String(l.qty);
  while (q.length < 4) { q = ' ' + q }
  s = s + q;
  let p = (l.qty * l.price).toFixed(2);
  if (c == 'EUR') { p = p.replace('.', ',') + ' €' } else { if (c == 'USD') { p = '$' + p } else { p = p + ' ' + c } }
  while (p.length < 12) { p = ' ' + p }
  s = s + p;
  if (showVat) { s = s + (l.vat * 100).toFixed(0).padStart(3) + '%' }
  return s;
}

export function invoiceNumber(year: number, seq: number) {
  let s = String(seq);
  while (s.length < 5) s = '0' + s;
  return 'INV-' + year + '-' + s;
}
