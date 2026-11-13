import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../src/config.ts';

describe('loadConfig', () => {
  it('uses defaults', () => {
    assert.deepEqual(loadConfig({}), { port: 3000, databaseUrl: 'postgres://localhost/app', logLevel: 'info' });
  });

  it('reads overrides from the environment', () => {
    const config = loadConfig({ PORT: '8080', LOG_LEVEL: 'debug' });
    assert.equal(config.port, 8080);
    assert.equal(config.logLevel, 'debug');
  });
});
