import test from 'node:test';
import assert from 'node:assert/strict';
import { convertToCents, convertToCub, calculaProposta } from './script.js';

test('deve converter um decimal em um inteiro', () => {
    const result = convertToCents(3182.95);
    assert.strictEqual(result, 318295);
});

test('deve calcular a equivalência em CUB', () => {
    const result = convertToCub(550800.50, 3182.95).toFixed(7);
    assert.strictEqual(result, '173.0471732');
});

test('deve calcular a proposta recebendo valor total, entrada e quantidade de parcelas', () => {
    const result = calculaProposta(550800.50, 55080.05, 100);
    assert.deepStrictEqual(result, {
        valorTotal: 550800.50,
        valorEntrada: 55080.05,
        saldo: 495720.45,
        quantidadeParcela: 100,
        valorParcela: 4957.2045
    });
});
