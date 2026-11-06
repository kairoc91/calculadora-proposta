import test from 'node:test';
import assert from 'node:assert/strict';
import {
  criarProposta,
  criarSinal,
  criarChaves,
  criarParcelasMensais,
  montarPropostaCompleta,
  calcularPagamentosAteChaves,
  calcularParcelas,
  calcularValorParcela,
} from './index.js';

test('deve calcular a proposta com sucesso e registrar data de entrada quando fornecida', () => {
  const resultado = criarProposta(500000, 100000, '2026-12-01');

  assert.deepStrictEqual(resultado, {
    valorTotal: 500000,
    valorEntrada: 100000,
    dataEntrada: '2026-12-01',
    saldoRestante: 400000,
    percentualEntrada: 20,
  });
});

test('deve criar sinal com data de pagamento', () => {
  const sinal = criarSinal(25000, '2026-11-15');
  assert.deepStrictEqual(sinal, {
    tipo: 'sinal',
    valor: 25000,
    data: '2026-11-15',
  });
});

test('deve criar chaves com data de vencimento', () => {
  const chaves = criarChaves(50000, '2028-06-30');
  assert.deepStrictEqual(chaves, {
    tipo: 'chaves',
    valor: 50000,
    dataVencimento: '2028-06-30',
  });
});

test('deve gerar cronograma de datas para parcelas mensais a partir do primeiro vencimento', () => {
  const mensais = criarParcelasMensais(100, 3, '2027-01-15');
  assert.strictEqual(mensais.tipo, 'mensal');
  assert.strictEqual(mensais.dataPrimeiroVencimento, '2027-01-15');
  assert.deepStrictEqual(mensais.parcelas, [
    { numero: 1, valor: 33.34, vencimento: '2027-01-15' },
    { numero: 2, valor: 33.33, vencimento: '2027-02-15' },
    { numero: 3, valor: 33.33, vencimento: '2027-03-15' },
  ]);
});

test('montarPropostaCompleta calcula percentuais de sinal, entrada, chaves e subtotal das modalidades', () => {
  const proposta = montarPropostaCompleta({
    valorTotal: 1000000,
    valorSinal: 50000,
    dataSinal: '2026-11-20',
    valorEntrada: 100000,
    dataEntrada: '2026-12-05',
    valorChaves: 200000,
    dataChaves: '2029-05-30',
    modalidades: [
      {
        tipo: 'mensal',
        total: 300000,
        quantidadeParcelas: 30,
        dataPrimeiroVencimento: '2027-01-10',
      },
      {
        tipo: 'anual',
        total: 200000,
        quantidadeParcelas: 2,
        dataPrimeiroVencimento: '2027-12-10',
      },
    ],
  });

  assert.strictEqual(proposta.percentualSinal, 5);
  assert.strictEqual(proposta.percentualEntrada, 10);
  assert.strictEqual(proposta.percentualChaves, 20);
  assert.strictEqual(proposta.subtotalModalidades, 500000);
  assert.strictEqual(proposta.percentualModalidades, 50);
});

test('calcularPagamentosAteChaves deve incluir a parcela das chaves por padrão', () => {
  const proposta = montarPropostaCompleta({
    valorTotal: 500000,
    valorSinal: 25000,
    dataSinal: '2026-12-01',
    valorEntrada: 75000,
    dataEntrada: '2027-01-15',
    valorChaves: 100000,
    dataChaves: '2027-04-10',
    modalidades: [
      {
        tipo: 'mensal',
        total: 120000,
        quantidadeParcelas: 6,
        dataPrimeiroVencimento: '2027-01-20',
      },
    ],
  });

  const relatorio = calcularPagamentosAteChaves(proposta, { incluirChaves: true });

  assert.strictEqual(relatorio.incluiuChaves, true);
  assert.strictEqual(relatorio.totalAteChaves, 260000); // Inclui os 100.000 das chaves
  assert.strictEqual(relatorio.percentualAteChaves, 52);
  assert.ok(relatorio.pagamentosAteChaves.some((p) => p.descricao === 'Chaves'));
});

test('calcularPagamentosAteChaves deve excluir a parcela das chaves quando incluirChaves: false', () => {
  const proposta = montarPropostaCompleta({
    valorTotal: 500000,
    valorSinal: 25000,
    dataSinal: '2026-12-01',
    valorEntrada: 75000,
    dataEntrada: '2027-01-15',
    valorChaves: 100000,
    dataChaves: '2027-04-10',
    modalidades: [
      {
        tipo: 'mensal',
        total: 120000,
        quantidadeParcelas: 6,
        dataPrimeiroVencimento: '2027-01-20',
      },
    ],
  });

  const relatorio = calcularPagamentosAteChaves(proposta, { incluirChaves: false });

  assert.strictEqual(relatorio.incluiuChaves, false);
  assert.strictEqual(relatorio.totalAteChaves, 160000); // 260.000 - 100.000 das chaves
  assert.strictEqual(relatorio.percentualAteChaves, 32); // 160.000 / 500.000 = 32%
  assert.ok(!relatorio.pagamentosAteChaves.some((p) => p.descricao === 'Chaves'));
  assert.ok(relatorio.pagamentosAposChaves.some((p) => p.descricao === 'Chaves'));
});

test('calcularPagamentosAteChaves lança erro se não houver data das chaves', () => {
  const proposta = montarPropostaCompleta({
    valorTotal: 500000,
    valorChaves: 50000,
  });

  assert.throws(
    () => calcularPagamentosAteChaves(proposta),
    { message: /A data de vencimento das chaves deve ser informada/ }
  );
});

test('calcularParcelas e calcularValorParcela mantêm compatibilidade', () => {
  const res = calcularParcelas(100, 3);
  assert.strictEqual(res.primeiraParcela, 33.34);
  assert.strictEqual(calcularValorParcela(100, 3), 33.34);
});
