const DEFAULT_NAME = 'visitante';

export function greeting(name?: string): string {
  const who = name?.trim() || DEFAULT_NAME;
  return `Bienvenido, ${who}`;
}
