import test from 'node:test';
import assert from 'node:assert/strict';
import { convertToCents, convertToCub } from './script.js';

test('deve converter um decimal em um inteiro', () => {
    const result = convertToCents(3182.95);
    assert.strictEqual(result, 318295);
});

test('deve calcular a equivalência em CUB', () => {
    const result = convertToCub(550800, 3182.95).toFixed(7);
    assert.strictEqual(result, '173.0470161');
});
