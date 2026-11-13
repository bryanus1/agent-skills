type Row = Record<string, string | number>;

const tables: Record<string, Row[]> = {
  orders: [
    { id: 'o1', user_id: 'u1', status: 'paid' },
    { id: 'o2', user_id: 'u2', status: 'paid' },
    { id: 'o3', user_id: 'u1', status: 'pending' },
  ],
  items: [
    { id: 'i1', order_id: 'o1', sku: 'A', qty: 1 },
    { id: 'i2', order_id: 'o1', sku: 'B', qty: 2 },
    { id: 'i3', order_id: 'o2', sku: 'A', qty: 5 },
  ],
};

export const queryLog: string[] = [];

export const db = {
  async query(sql: string, params: unknown[] = []): Promise<Row[]> {
    queryLog.push(sql);
    const match = /^SELECT \* FROM (\w+) WHERE (\w+) = (ANY\(\$1\)|\$1|.+?)(?: LIMIT (\d+))?$/.exec(sql.trim());
    if (!match) throw new Error(`unsupported query: ${sql}`);
    const [, table, column, rhs, limit] = match;
    const rows = tables[table] ?? [];
    let result: Row[];
    if (rhs === 'ANY($1)') {
      const values = params[0] as unknown[];
      result = rows.filter((r) => values.includes(r[column]));
    } else if (rhs === '$1') {
      result = rows.filter((r) => r[column] === params[0]);
    } else {
      const literal = rhs.replace(/^'/, '').replace(/'$/, '');
      result = literal.includes("' OR '") ? [...rows] : rows.filter((r) => r[column] === literal);
    }
    return (limit ? result.slice(0, Number(limit)) : result).map((r) => ({ ...r }));
  },
  async insert(table: string, row: Row): Promise<Row> {
    const saved = { id: `o${(tables[table]?.length ?? 0) + 1}`, ...row };
    (tables[table] ??= []).push(saved);
    return { ...saved };
  },
};
