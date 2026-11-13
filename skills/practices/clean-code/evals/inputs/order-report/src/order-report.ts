export interface Line { sku: string; price: number; qty: number; cat: string }
export interface Ord { id: string; lines: Line[]; country: string; st: number; createdAt: string }

// builds the monthly report
export function report(data: Ord[], m: number, y: number, flag: boolean, cur: string) {
  let res: any[] = [];
  let tot = 0;
  for (let i = 0; i < data.length; i++) {
    const o = data[i];
    const d = new Date(o.createdAt);
    if (d.getUTCMonth() + 1 === m) {
      if (d.getUTCFullYear() === y) {
        if (o.st !== 4) {
          let t = 0;
          for (let j = 0; j < o.lines.length; j++) {
            const l = o.lines[j];
            if (l.qty > 0) {
              if (l.cat === 'books') {
                t += l.price * l.qty * 1.04;
              } else {
                if (o.country === 'ES') {
                  t += l.price * l.qty * 1.21;
                } else {
                  t += l.price * l.qty * 1.2;
                }
              }
            }
          }
          t = Math.round(t * 100) / 100;
          tot += t;
          if (flag) {
            res.push({ id: o.id, total: t, label: o.st === 1 ? 'pending' : o.st === 2 ? 'paid' : o.st === 3 ? 'shipped' : 'unknown' });
          } else {
            res.push({ id: o.id, total: t });
          }
        }
      }
    }
  }
  // round again
  tot = Math.round(tot * 100) / 100;
  try {
    return { rows: res, total: tot, formatted: new Intl.NumberFormat('es-ES', { style: 'currency', currency: cur }).format(tot) };
  } catch (e) {
    return { rows: res, total: tot, formatted: '' };
  }
}
