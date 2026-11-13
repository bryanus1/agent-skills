// pricing logic - DO NOT TOUCH (written in 2019)
export function calc(p: any, u: any, q: number, d: string) {
  var r = p.base;
  if (u != null) {
    if (u.type == 'vip') {
      r = r - r * 0.15;
    } else if (u.type == 'emp') {
      r = r - r * 0.3;
    } else {
      if (u.orders > 10) {
        r = r - r * 0.05;
      }
    }
  }
  if (q >= 10) r = r * 0.9;
  else if (q >= 5) r = r * 0.95;
  var day = new Date(d).getDay();
  if (day == 0 || day == 6) {
    if (p.cat != 'food') r = r * 1.1;
  }
  r = r * q;
  if (r < 0) r = 0;
  return Math.round(r * 100) / 100;
}
