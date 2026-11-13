const UNITS: Record<string, number> = { h: 3600, m: 60 };

/**
 * Converts a human duration such as "1h30m" or "45m" into seconds.
 */
export function parseDuration(input: string): number {
  const matches = input.trim().matchAll(/(\d+)([hm])/g);
  let total = 0;
  for (const [, amount, unit] of matches) {
    total += Number(amount) * UNITS[unit];
  }
  return total;
}
