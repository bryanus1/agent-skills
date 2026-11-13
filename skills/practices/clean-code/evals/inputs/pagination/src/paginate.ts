export function paginate(items: any[], p: any, s: any) {
  var res: any = {};
  if (!p || p < 1) { p = 1 }
  if (!s) { s = 10 } else { if (s > 100) { s = 100 } }
  var start = (p - 1) * s;
  var end = start + s;
  res.data = items.slice(start, end);
  res.page = p;
  res.pageSize = s;
  res.total = items.length;
  res.totalPages = Math.ceil(items.length / s);
  if (p * s < items.length - 1) { res.hasNext = true } else { res.hasNext = false }
  if (p > 1) { res.hasPrev = true } else { res.hasPrev = false }
  return res;
}
