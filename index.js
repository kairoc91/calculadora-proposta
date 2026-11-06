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
 * Normaliza e valida data (string 'AAAA-MM-DD' ou objeto Date).
 * Retorna string 'AAAA-MM-DD' ou null se não informada.
 * 
 * @param {string|Date|null|undefined} data
 * @param {string} nomeCampo
 * @returns {string|null}
 */
export function normalizarData(data, nomeCampo = 'data') {
  if (data === null || data === undefined || data === '') {
    return null;
  }

  if (data instanceof Date) {
    if (Number.isNaN(data.getTime())) {
      throw new TypeError(`Data inválida informada para ${nomeCampo}.`);
    }
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  if (typeof data === 'string') {
    const limpa = data.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(limpa)) {
      throw new TypeError(`A data de ${nomeCampo} deve estar no formato AAAA-MM-DD.`);
    }
    const [ano, mes, dia] = limpa.split('-').map(Number);
    const d = new Date(ano, mes - 1, dia);
    if (d.getFullYear() !== ano || d.getMonth() !== mes - 1 || d.getDate() !== dia) {
      throw new TypeError(`Data inválida informada para ${nomeCampo}.`);
    }
    return limpa;
  }

  throw new TypeError(`Tipo inválido para ${nomeCampo}. Esperado string 'AAAA-MM-DD' ou Date.`);
}

/**
 * Adiciona meses mantendo a coerência de datas e limites de dias do mês.
 * 
 * @param {string} dataIso - 'AAAA-MM-DD'
 * @param {number} mesesAdicionar
 * @returns {string} 'AAAA-MM-DD'
 */
export function adicionarMeses(dataIso, mesesAdicionar) {
  const [ano, mes, dia] = dataIso.split('-').map(Number);
  const dataAlvo = new Date(ano, mes - 1 + mesesAdicionar, 1);
  const ultimoDiaMesAlvo = new Date(dataAlvo.getFullYear(), dataAlvo.getMonth() + 1, 0).getDate();
  const diaFinal = Math.min(dia, ultimoDiaMesAlvo);

  const anoFinal = dataAlvo.getFullYear();
  const mesFinal = String(dataAlvo.getMonth() + 1).padStart(2, '0');
  const diaFormatado = String(diaFinal).padStart(2, '0');

  return `${anoFinal}-${mesFinal}-${diaFormatado}`;
}

/**
 * Retorna o incremento em meses para cada modalidade de parcelamento.
 * 
 * @param {string} tipo
 * @returns {number}
 */
function obterIntervaloMesesPorTipo(tipo) {
  switch (tipo) {
    case 'trimestral':
      return 3;
    case 'semestral':
      return 6;
    case 'anual':
      return 12;
    case 'mensal':
    default:
      return 1;
  }
}

/**
 * Calcula a divisão de um saldo em parcelas com ajuste de dízima/centavos na primeira parcela
 * e cronograma de vencimentos caso uma dataInicial seja fornecida.
 */
function gerarParcelamento(saldo, quantidadeParcelas, tipo = 'parcela', dataPrimeiroVencimento = null) {
  validarValorMonetario(saldo, 'saldo');
  validarQuantidadeParcelas(quantidadeParcelas);
  const dataValida = normalizarData(dataPrimeiroVencimento, `primeiro vencimento de ${tipo}`);

  if (saldo === 0) {
    const intervaloMeses = obterIntervaloMesesPorTipo(tipo);
    const parcelas = Array.from({ length: quantidadeParcelas }, (_, index) => ({
      numero: index + 1,
      valor: 0,
      vencimento: dataValida ? adicionarMeses(dataValida, index * intervaloMeses) : null,
    }));

    return {
      tipo,
      quantidadeParcelas,
      primeiraParcela: 0,
      demaisParcelas: 0,
      total: 0,
      dataPrimeiroVencimento: dataValida,
      parcelas,
    };
  }

  const totalCentavos = Math.round(saldo * 100);
  const baseCentavos = Math.floor(totalCentavos / quantidadeParcelas);
  const residuoCentavos = totalCentavos - (baseCentavos * quantidadeParcelas);
  const primeiraCentavos = baseCentavos + residuoCentavos;

  const primeiraParcela = primeiraCentavos / 100;
  const demaisParcelas = baseCentavos / 100;

  const intervaloMeses = obterIntervaloMesesPorTipo(tipo);
  const parcelas = Array.from({ length: quantidadeParcelas }, (_, index) => {
    const valor = index === 0 ? primeiraParcela : demaisParcelas;
    const vencimento = dataValida ? adicionarMeses(dataValida, index * intervaloMeses) : null;
    return {
      numero: index + 1,
      valor,
      vencimento,
    };
  });

  return {
    tipo,
    quantidadeParcelas,
    primeiraParcela,
    demaisParcelas,
    total: saldo,
    dataPrimeiroVencimento: dataValida,
    parcelas,
  };
}

/**
 * Processa a proposta imobiliária básica.
 */
export function criarProposta(valorTotal, valorEntrada, dataEntrada = null) {
  validarValorMonetario(valorTotal, 'valor total do imóvel', false);
  validarValorMonetario(valorEntrada, 'valor de entrada', true);
  const dataEntradaValida = normalizarData(dataEntrada, 'data de entrada');

  if (valorEntrada > valorTotal) {
    throw new RangeError('O valor de entrada não pode ser maior que o valor total do imóvel.');
  }

  const saldoRestante = valorTotal - valorEntrada;
  const percentualEntrada = (valorEntrada / valorTotal) * 100;

  return {
    valorTotal,
    valorEntrada,
    dataEntrada: dataEntradaValida,
    saldoRestante,
    percentualEntrada,
  };
}

/**
 * Recebe e valida o valor e data de sinal.
 */
export function criarSinal(valor, data = null) {
  validarValorMonetario(valor, 'valor do sinal');
  const dataSinal = normalizarData(data, 'data do sinal');
  return {
    tipo: 'sinal',
    valor,
    data: dataSinal,
  };
}

/**
 * Recebe e valida o valor e vencimento das chaves.
 */
export function criarChaves(valor, dataVencimento = null) {
  validarValorMonetario(valor, 'valor das chaves');
  const vencimento = normalizarData(dataVencimento, 'vencimento das chaves');
  return {
    tipo: 'chaves',
    valor,
    dataVencimento: vencimento,
  };
}

export function criarParcelasMensais(saldo, quantidade, dataPrimeiroVencimento = null) {
  return gerarParcelamento(saldo, quantidade, 'mensal', dataPrimeiroVencimento);
}

export function criarParcelasTrimestrais(saldo, quantidade, dataPrimeiroVencimento = null) {
  return gerarParcelamento(saldo, quantidade, 'trimestral', dataPrimeiroVencimento);
}

export function criarParcelasSemestrais(saldo, quantidade, dataPrimeiroVencimento = null) {
  return gerarParcelamento(saldo, quantidade, 'semestral', dataPrimeiroVencimento);
}

export function criarParcelasAnuais(saldo, quantidade, dataPrimeiroVencimento = null) {
  return gerarParcelamento(saldo, quantidade, 'anual', dataPrimeiroVencimento);
}

/**
 * Monta proposta consolidada com suporte a datas e cálculo explícito de percentuais
 * de cada componente em relação ao valor total do imóvel.
 */
export function montarPropostaCompleta({
  valorTotal,
  valorEntrada = 0,
  dataEntrada = null,
  valorSinal = 0,
  dataSinal = null,
  valorChaves = 0,
  dataChaves = null,
  modalidades = [],
}) {
  validarValorMonetario(valorTotal, 'valor total do imóvel', false);
  validarValorMonetario(valorEntrada, 'valor de entrada', true);
  validarValorMonetario(valorSinal, 'valor de sinal', true);
  validarValorMonetario(valorChaves, 'valor das chaves', true);

  const sinalObj = criarSinal(valorSinal, dataSinal);
  const chavesObj = criarChaves(valorChaves, dataChaves);
  const dataEntradaValida = normalizarData(dataEntrada, 'data de entrada');

  if (!Array.isArray(modalidades)) {
    throw new TypeError('As modalidades devem ser fornecidas em uma lista (array).');
  }

  const parcelamentosProcessados = modalidades.map((mod, index) => {
    if (!mod || typeof mod !== 'object') {
      throw new TypeError(`Modalidade no índice ${index} inválida.`);
    }
    const { tipo, total, quantidadeParcelas, dataPrimeiroVencimento } = mod;
    const parcelamento = gerarParcelamento(
      total,
      quantidadeParcelas,
      tipo || `modalidade_${index + 1}`,
      dataPrimeiroVencimento || null
    );

    const percentualModalidade = (parcelamento.total / valorTotal) * 100;
    return {
      ...parcelamento,
      percentual: percentualModalidade,
    };
  });

  const somaParcelamentosCentavos = parcelamentosProcessados.reduce(
    (acc, mod) => acc + Math.round(mod.total * 100),
    0
  );

  const subtotalModalidades = somaParcelamentosCentavos / 100;
  const percentualModalidades = (subtotalModalidades / valorTotal) * 100;

  const valorTotalCentavos = Math.round(valorTotal * 100);
  const entradaCentavos = Math.round(valorEntrada * 100);
  const sinalCentavos = Math.round(valorSinal * 100);
  const chavesCentavos = Math.round(valorChaves * 100);

  const totalComprometidoCentavos = entradaCentavos + sinalCentavos + chavesCentavos + somaParcelamentosCentavos;

  if (totalComprometidoCentavos > valorTotalCentavos) {
    const totalComprometido = totalComprometidoCentavos / 100;
    throw new RangeError(
      `A soma dos valores da proposta (R$ ${totalComprometido.toFixed(2)}) supera o valor total do imóvel (R$ ${valorTotal.toFixed(2)}).`
    );
  }

  const saldoRestanteCentavos = valorTotalCentavos - totalComprometidoCentavos;
  const saldoRestante = saldoRestanteCentavos / 100;
  const totalComprometido = totalComprometidoCentavos / 100;
  const percentualComprometido = (totalComprometidoCentavos / valorTotalCentavos) * 100;

  const percentualSinal = (sinalObj.valor / valorTotal) * 100;
  const percentualEntrada = (valorEntrada / valorTotal) * 100;
  const percentualChaves = (chavesObj.valor / valorTotal) * 100;
  const percentualSaldoRestante = (saldoRestante / valorTotal) * 100;

  return {
    valorTotal,
    valorEntrada,
    percentualEntrada,
    dataEntrada: dataEntradaValida,
    valorSinal: sinalObj.valor,
    percentualSinal,
    dataSinal: sinalObj.data,
    valorChaves: chavesObj.valor,
    percentualChaves,
    dataChaves: chavesObj.dataVencimento,
    subtotalModalidades,
    percentualModalidades,
    modalidades: parcelamentosProcessados,
    totalComprometido,
    saldoRestante,
    percentualComprometido,
    percentualSaldoRestante,
  };
}

/**
 * Calcula quais pagamentos (sinal, entrada, parcelas e opcionalmente as chaves) ocorrem até a data
 * de vencimento da parcela das chaves, totalizando o valor e o percentual pago.
 * 
 * @param {object} proposta - Objeto retornado por montarPropostaCompleta.
 * @param {object|string|Date} [opcoesOuData={}] - Opções ({ incluirChaves: boolean, dataChaves: string }) ou data limite diretamente.
 * @param {boolean} [opcoesOuData.incluirChaves=true] - Se a parcela das chaves deve ser incluída no somatório.
 * @param {string|Date} [opcoesOuData.dataChaves] - Sobrescreve a data de chaves da proposta.
 * @returns {{
 *   dataLimiteChaves: string,
 *   incluiuChaves: boolean,
 *   totalAteChaves: number,
 *   percentualAteChaves: number,
 *   pagamentosAteChaves: Array<{ descricao: string, valor: number, vencimento: string }>,
 *   pagamentosAposChaves: Array<{ descricao: string, valor: number, vencimento: string }>
 * }}
 */
export function calcularPagamentosAteChaves(proposta, opcoesOuData = {}) {
  if (!proposta || typeof proposta !== 'object') {
    throw new TypeError('Proposta inválida informada.');
  }

  let incluirChaves = true;
  let dataChavesInformada = null;

  if (typeof opcoesOuData === 'string' || opcoesOuData instanceof Date) {
    dataChavesInformada = opcoesOuData;
  } else if (opcoesOuData && typeof opcoesOuData === 'object') {
    if (typeof opcoesOuData.incluirChaves === 'boolean') {
      incluirChaves = opcoesOuData.incluirChaves;
    }
    if (opcoesOuData.dataChaves) {
      dataChavesInformada = opcoesOuData.dataChaves;
    }
  }

  const dataLimite = normalizarData(
    dataChavesInformada || proposta.dataChaves,
    'vencimento das chaves'
  );

  if (!dataLimite) {
    throw new Error('A data de vencimento das chaves deve ser informada para calcular os pagamentos até as chaves.');
  }

  const pagamentosAteChaves = [];
  const pagamentosAposChaves = [];

  // Sinal
  if (proposta.valorSinal > 0) {
    const item = {
      descricao: 'Sinal',
      valor: proposta.valorSinal,
      vencimento: proposta.dataSinal || null,
    };
    if (item.vencimento && item.vencimento <= dataLimite) {
      pagamentosAteChaves.push(item);
    } else {
      pagamentosAposChaves.push(item);
    }
  }

  // Entrada
  if (proposta.valorEntrada > 0) {
    const item = {
      descricao: 'Entrada',
      valor: proposta.valorEntrada,
      vencimento: proposta.dataEntrada || null,
    };
    if (item.vencimento && item.vencimento <= dataLimite) {
      pagamentosAteChaves.push(item);
    } else {
      pagamentosAposChaves.push(item);
    }
  }

  // Chaves: incluída em "até chaves" ou tratada como pós/separada dependendo da flag
  if (proposta.valorChaves > 0) {
    const item = {
      descricao: 'Chaves',
      valor: proposta.valorChaves,
      vencimento: proposta.dataChaves || dataLimite,
    };

    if (incluirChaves) {
      pagamentosAteChaves.push(item);
    } else {
      pagamentosAposChaves.push(item);
    }
  }

  // Parcelas de todas as modalidades
  if (Array.isArray(proposta.modalidades)) {
    proposta.modalidades.forEach((mod) => {
      if (Array.isArray(mod.parcelas)) {
        mod.parcelas.forEach((p) => {
          if (p.valor > 0) {
            const item = {
              descricao: `Parcela ${p.numero} (${mod.tipo})`,
              valor: p.valor,
              vencimento: p.vencimento,
            };
            if (item.vencimento && item.vencimento <= dataLimite) {
              pagamentosAteChaves.push(item);
            } else {
              pagamentosAposChaves.push(item);
            }
          }
        });
      }
    });
  }

  // Ordena os pagamentos cronologicamente por vencimento
  pagamentosAteChaves.sort((a, b) => (a.vencimento || '').localeCompare(b.vencimento || ''));
  pagamentosAposChaves.sort((a, b) => (a.vencimento || '').localeCompare(b.vencimento || ''));

  const totalAteChavesCentavos = pagamentosAteChaves.reduce(
    (acc, cur) => acc + Math.round(cur.valor * 100),
    0
  );

  const totalAteChaves = totalAteChavesCentavos / 100;
  const percentualAteChaves = proposta.valorTotal > 0
    ? (totalAteChaves / proposta.valorTotal) * 100
    : 0;

  return {
    dataLimiteChaves: dataLimite,
    incluiuChaves: incluirChaves,
    totalAteChaves,
    percentualAteChaves,
    pagamentosAteChaves,
    pagamentosAposChaves,
  };
}

export function calcularParcelas(saldo, quantidadeParcelas, dataPrimeiroVencimento = null) {
  const resultado = gerarParcelamento(saldo, quantidadeParcelas, 'parcela', dataPrimeiroVencimento);
  return {
    primeiraParcela: resultado.primeiraParcela,
    demaisParcelas: resultado.demaisParcelas,
    parcelas: resultado.parcelas.map((p) => p.valor),
  };
}

export function calcularValorParcela(saldo, quantidadeParcelas) {
  const { primeiraParcela } = calcularParcelas(saldo, quantidadeParcelas);
  return primeiraParcela;
}
