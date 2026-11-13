export interface AppConfig {
  port: number;
  databaseUrl: string;
  logLevel: 'debug' | 'info' | 'error';
}

export function loadConfig(env: Record<string, string | undefined> = process.env): AppConfig {
  return {
    port: Number(env.PORT ?? 3000),
    databaseUrl: env.DATABASE_URL ?? 'postgres://localhost/app',
    logLevel: (env.LOG_LEVEL as AppConfig['logLevel']) ?? 'info',
  };
}
