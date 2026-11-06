import test from 'node:test';
import assert from 'node:assert/strict';
import {
  criarProposta,
  criarSinal,
  criarChaves,
  criarParcelasMensais,
  criarParcelasTrimestrais,
  criarParcelasSemestrais,
  criarParcelasAnuais,
  calcularParcelas,
  calcularValorParcela,
} from './index.js';

test('deve calcular a proposta com sucesso para valores válidos', () => {
  const resultado = criarProposta(500000, 100000);

  assert.deepStrictEqual(resultado, {
    valorTotal: 500000,
    valorEntrada: 100000,
    saldoRestante: 400000,
    percentualEntrada: 20,
  });
});

test('deve criar sinal com sucesso', () => {
  const sinal = criarSinal(25000);
  assert.deepStrictEqual(sinal, {
    tipo: 'sinal',
    valor: 25000,
  });
});

test('deve lançar TypeError ao criar sinal com valor inválido', () => {
  assert.throws(() => criarSinal(-10), { name: 'TypeError' });
  assert.throws(() => criarSinal('25000'), { name: 'TypeError' });
  assert.throws(() => criarSinal(Number.NaN), { name: 'TypeError' });
});

test('deve criar chaves com sucesso', () => {
  const chaves = criarChaves(50000);
  assert.deepStrictEqual(chaves, {
    tipo: 'chaves',
    valor: 50000,
  });
});

test('deve lançar TypeError ao criar chaves com valor inválido', () => {
  assert.throws(() => criarChaves(-1), { name: 'TypeError' });
  assert.throws(() => criarChaves(Number.NaN), { name: 'TypeError' });
});

test('deve gerar parcelas mensais com ajuste de dízima na primeira parcela', () => {
  const mensais = criarParcelasMensais(100, 3);
  assert.strictEqual(mensais.tipo, 'mensal');
  assert.strictEqual(mensais.quantidadeParcelas, 3);
  assert.strictEqual(mensais.primeiraParcela, 33.34);
  assert.strictEqual(mensais.demaisParcelas, 33.33);
  assert.deepStrictEqual(mensais.parcelas, [33.34, 33.33, 33.33]);
  assert.strictEqual(mensais.total, 100);
});

test('deve gerar parcelas trimestrais', () => {
  const trimestrais = criarParcelasTrimestrais(12000, 4);
  assert.strictEqual(trimestrais.tipo, 'trimestral');
  assert.strictEqual(trimestrais.quantidadeParcelas, 4);
  assert.strictEqual(trimestrais.primeiraParcela, 3000);
  assert.strictEqual(trimestrais.demaisParcelas, 3000);
  assert.strictEqual(trimestrais.parcelas.length, 4);
});

test('deve gerar parcelas semestrais', () => {
  const semestrais = criarParcelasSemestrais(25000, 2);
  assert.strictEqual(semestrais.tipo, 'semestral');
  assert.strictEqual(semestrais.quantidadeParcelas, 2);
  assert.strictEqual(semestrais.primeiraParcela, 12500);
  assert.strictEqual(semestrais.demaisParcelas, 12500);
});

test('deve gerar parcelas anuais', () => {
  const anuais = criarParcelasAnuais(50000, 5);
  assert.strictEqual(anuais.tipo, 'anual');
  assert.strictEqual(anuais.quantidadeParcelas, 5);
  assert.strictEqual(anuais.primeiraParcela, 10000);
  assert.strictEqual(anuais.demaisParcelas, 10000);
});

test('calcularParcelas e calcularValorParcela mantêm compatibilidade', () => {
  const res = calcularParcelas(100, 3);
  assert.strictEqual(res.primeiraParcela, 33.34);
  assert.strictEqual(calcularValorParcela(100, 3), 33.34);
});
