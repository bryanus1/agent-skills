import { test } from 'node:test';
import assert from 'node:assert/strict';
import { greeting } from '../src/greeting.ts';

test('saluda por el nombre', () => {
  assert.equal(greeting('Ana'), 'Bienvenido, Ana');
});

test('usa un nombre por defecto', () => {
  assert.equal(greeting('  '), 'Bienvenido, visitante');
});
