export const rows: { id: string; email: string; total: number }[] = [];

export function insertOrder(email: string, total: number): string {
  const id = 'o' + (rows.length + 1);
  rows.push({ id, email, total });
  return id;
}

export function resetDb(): void {
  rows.length = 0;
}
