/**
 * Valida se um valor monetário é um número válido e não-negativo.
 * 
 * @param {number} valor
 * @param {string} nomeCampo
 * @param {boolean} [permiteZero=true]
 */
function validarValorMonetario(valor, nomeCampo, permiteZero = true) {
  if (typeof valor !== 'number' || Number.isNaN(valor)) {
    throw new TypeError(`O campo ${nomeCampo} deve ser um número.`);
  }

  if (permiteZero ? valor < 0 : valor <= 0) {
    const condicao = permiteZero ? 'maior ou igual a zero' : 'positivo';
    throw new TypeError(`O campo ${nomeCampo} deve ser um número ${condicao}.`);
  }
}

/**
 * Valida se uma quantidade de parcelas é um inteiro positivo.
 * 
 * @param {number} quantidade
 * @param {string} nomeCampo
 */
function validarQuantidadeParcelas(quantidade, nomeCampo = 'quantidade de parcelas') {
  if (
    typeof quantidade !== 'number' ||
    Number.isNaN(quantidade) ||
    !Number.isInteger(quantidade) ||
    quantidade <= 0
  ) {
    throw new TypeError(`O campo ${nomeCampo} deve ser um número inteiro positivo.`);
  }
}

/**
 * Calcula a divisão de um saldo em parcelas com ajuste de dízima/centavos na primeira parcela.
 * 
 * @param {number} saldo
 * @param {number} quantidadeParcelas
 * @param {string} [tipo='parcela']
 * @returns {{ tipo: string, quantidadeParcelas: number, primeiraParcela: number, demaisParcelas: number, total: number, parcelas: number[] }}
 */
function gerarParcelamento(saldo, quantidadeParcelas, tipo = 'parcela') {
  validarValorMonetario(saldo, 'saldo');
  validarQuantidadeParcelas(quantidadeParcelas);

  if (saldo === 0) {
    return {
      tipo,
      quantidadeParcelas,
      primeiraParcela: 0,
      demaisParcelas: 0,
      total: 0,
      parcelas: Array.from({ length: quantidadeParcelas }, () => 0),
    };
  }

  const totalCentavos = Math.round(saldo * 100);
  const baseCentavos = Math.floor(totalCentavos / quantidadeParcelas);
  const residuoCentavos = totalCentavos - (baseCentavos * quantidadeParcelas);
  const primeiraCentavos = baseCentavos + residuoCentavos;

  const primeiraParcela = primeiraCentavos / 100;
  const demaisParcelas = baseCentavos / 100;

  const parcelas = Array.from({ length: quantidadeParcelas }, (_, index) => {
    return index === 0 ? primeiraParcela : demaisParcelas;
  });

  return {
    tipo,
    quantidadeParcelas,
    primeiraParcela,
    demaisParcelas,
    total: saldo,
    parcelas,
  };
}

/**
 * Processa a proposta imobiliária básica.
 */
export function criarProposta(valorTotal, valorEntrada) {
  validarValorMonetario(valorTotal, 'valor total do imóvel', false);
  validarValorMonetario(valorEntrada, 'valor de entrada', true);

  if (valorEntrada > valorTotal) {
    throw new RangeError('O valor de entrada não pode ser maior que o valor total do imóvel.');
  }

  const saldoRestante = valorTotal - valorEntrada;
  const percentualEntrada = (valorEntrada / valorTotal) * 100;

  return {
    valorTotal,
    valorEntrada,
    saldoRestante,
    percentualEntrada,
  };
}

/**
 * Recebe e valida o valor de sinal (reserva/arras).
 * 
 * @param {number} valor
 * @returns {{ tipo: 'sinal', valor: number }}
 */
export function criarSinal(valor) {
  validarValorMonetario(valor, 'valor do sinal');
  return {
    tipo: 'sinal',
    valor,
  };
}

/**
 * Recebe e valida o valor de chaves (parcela das chaves / entrega).
 * 
 * @param {number} valor
 * @returns {{ tipo: 'chaves', valor: number }}
 */
export function criarChaves(valor) {
  validarValorMonetario(valor, 'valor das chaves');
  return {
    tipo: 'chaves',
    valor,
  };
}

/**
 * Gera parcelamento mensal.
 * 
 * @param {number} saldo
 * @param {number} quantidade
 */
export function criarParcelasMensais(saldo, quantidade) {
  return gerarParcelamento(saldo, quantidade, 'mensal');
}

/**
 * Gera parcelamento trimestral.
 * 
 * @param {number} saldo
 * @param {number} quantidade
 */
export function criarParcelasTrimestrais(saldo, quantidade) {
  return gerarParcelamento(saldo, quantidade, 'trimestral');
}

/**
 * Gera parcelamento semestral.
 * 
 * @param {number} saldo
 * @param {number} quantidade
 */
export function criarParcelasSemestrais(saldo, quantidade) {
  return gerarParcelamento(saldo, quantidade, 'semestral');
}

/**
 * Gera parcelamento anual.
 * 
 * @param {number} saldo
 * @param {number} quantidade
 */
export function criarParcelasAnuais(saldo, quantidade) {
  return gerarParcelamento(saldo, quantidade, 'anual');
}

/**
 * Função utilitária genérica de parcelamento.
 */
export function calcularParcelas(saldo, quantidadeParcelas) {
  const resultado = gerarParcelamento(saldo, quantidadeParcelas, 'parcela');
  return {
    primeiraParcela: resultado.primeiraParcela,
    demaisParcelas: resultado.demaisParcelas,
    parcelas: resultado.parcelas,
  };
}

export function calcularValorParcela(saldo, quantidadeParcelas) {
  const { primeiraParcela } = calcularParcelas(saldo, quantidadeParcelas);
  return primeiraParcela;
}
