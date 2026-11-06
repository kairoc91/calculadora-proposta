import { montarPropostaCompleta, calcularPagamentosAteChaves } from './index.js';

function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

function formatarPercentual(valor) {
  return `${valor.toFixed(2)}%`;
}

function formatarData(dataIso) {
  if (!dataIso) return 'Não informada';
  const [ano, mes, dia] = dataIso.split('-');
  return `${dia}/${mes}/${ano}`;
}

const form = document.getElementById('proposta-form');
const resultadoContainer = document.getElementById('resultado');
const modalidadesContainer = document.getElementById('modalidades-container');
const btnAdicionarModalidade = document.getElementById('btn-adicionar-modalidade');
const btnLimpar = document.getElementById('btn-limpar');

function criarElemento(tag, texto = '', atributos = {}) {
  const el = document.createElement(tag);
  if (texto) {
    el.textContent = texto;
  }
  for (const [chave, valor] of Object.entries(atributos)) {
    if (chave === 'className') {
      el.className = valor;
    } else {
      el.setAttribute(chave, valor);
    }
  }
  return el;
}

function criarItemLista(rotulo, valor) {
  const li = document.createElement('li');
  const strong = criarElemento('strong', `${rotulo}: `);
  li.appendChild(strong);
  li.appendChild(document.createTextNode(valor));
  return li;
}

function criarLinhaModalidade(tipoPadrao = 'mensal', valorPadrao = '', parcelasPadrao = '') {
  const wrapper = criarElemento('div', '', { className: 'modalidade-item' });
  wrapper.appendChild(document.createElement('hr'));

  const p = document.createElement('p');

  // Tipo
  p.appendChild(criarElemento('label', 'Tipo: '));
  const select = criarElemento('select', '', { className: 'mod-tipo' });
  const tipos = [
    { valor: 'mensal', texto: 'Mensal' },
    { valor: 'trimestral', texto: 'Trimestral' },
    { valor: 'semestral', texto: 'Semestral' },
    { valor: 'anual', texto: 'Anual' },
  ];
  for (const item of tipos) {
    const opt = criarElemento('option', item.texto, { value: item.valor });
    if (item.valor === tipoPadrao) opt.selected = true;
    select.appendChild(opt);
  }
  p.appendChild(select);
  p.appendChild(document.createTextNode(' '));

  // Valor Total da Modalidade
  p.appendChild(criarElemento('label', 'Valor Total (R$): '));
  const inputTotal = criarElemento('input', '', {
    type: 'number',
    className: 'mod-total',
    step: '0.01',
    min: '0',
    required: 'true',
  });
  if (valorPadrao !== '') inputTotal.value = valorPadrao;
  p.appendChild(inputTotal);
  p.appendChild(document.createTextNode(' '));

  // Quantidade de Parcelas
  p.appendChild(criarElemento('label', 'Qtd. Parcelas: '));
  const inputParcelas = criarElemento('input', '', {
    type: 'number',
    className: 'mod-parcelas',
    min: '1',
    step: '1',
    required: 'true',
  });
  if (parcelasPadrao !== '') inputParcelas.value = parcelasPadrao;
  p.appendChild(inputParcelas);
  p.appendChild(document.createTextNode(' '));

  // Data do Primeiro Vencimento
  p.appendChild(criarElemento('label', '1º Vencimento: '));
  const inputData = criarElemento('input', '', {
    type: 'date',
    className: 'mod-data',
  });
  p.appendChild(inputData);
  p.appendChild(document.createTextNode(' '));

  // Botão Remover
  const btnRemover = criarElemento('button', 'Remover', {
    type: 'button',
    className: 'btn-remover-modalidade',
  });
  btnRemover.addEventListener('click', () => {
    wrapper.remove();
    agendarCalculo();
  });
  p.appendChild(btnRemover);

  wrapper.appendChild(p);
  modalidadesContainer.appendChild(wrapper);
}

// Inicializa com uma modalidade mensal padrão
criarLinhaModalidade('mensal', '', '');

btnAdicionarModalidade.addEventListener('click', () => {
  criarLinhaModalidade('semestral', '', '');
  agendarCalculo();
});

btnLimpar.addEventListener('click', () => {
  modalidadesContainer.replaceChildren();
  criarLinhaModalidade('mensal', '', '');
  resultadoContainer.replaceChildren(
    criarElemento('p', 'Preencha os campos e o cálculo será realizado automaticamente em tempo real.')
  );
});

/**
 * Executa o cálculo e atualiza o DOM de forma segura.
 */
async function processarCalculo() {
  const valorTotalInput = document.getElementById('valorTotal').value.trim();
  const valorTotal = Number(valorTotalInput);

  // Se o usuário ainda não preencheu um valor total positivo, aguarda a digitação
  if (!valorTotalInput || Number.isNaN(valorTotal) || valorTotal <= 0) {
    resultadoContainer.replaceChildren(
      criarElemento('p', 'Informe o valor total do imóvel para calcular a proposta em tempo real.')
    );
    return;
  }

  try {
    const valorEntrada = Number(document.getElementById('valorEntrada').value || 0);
    const dataEntrada = document.getElementById('dataEntrada').value || null;
    const valorSinal = Number(document.getElementById('valorSinal').value || 0);
    const dataSinal = document.getElementById('dataSinal').value || null;
    const valorChaves = Number(document.getElementById('valorChaves').value || 0);
    const dataChaves = document.getElementById('dataChaves').value || null;
    const incluirChaves = document.getElementById('incluirChavesNoCalculo').checked;

    const linhasModalidades = modalidadesContainer.querySelectorAll('.modalidade-item');
    const modalidades = [];

    for (const linha of linhasModalidades) {
      const tipo = linha.querySelector('.mod-tipo').value;
      const totalStr = linha.querySelector('.mod-total').value.trim();
      const parcelasStr = linha.querySelector('.mod-parcelas').value.trim();
      const dataPrimeiroVencimento = linha.querySelector('.mod-data').value || null;

      const total = Number(totalStr || 0);
      const quantidadeParcelas = Number(parcelasStr || 1);

      if (total > 0 && quantidadeParcelas > 0) {
        modalidades.push({
          tipo,
          total,
          quantidadeParcelas,
          dataPrimeiroVencimento,
        });
      }
    }

    const proposta = montarPropostaCompleta({
      valorTotal,
      valorEntrada,
      dataEntrada,
      valorSinal,
      dataSinal,
      valorChaves,
      dataChaves,
      modalidades,
    });

    const fragmento = document.createDocumentFragment();

    fragmento.appendChild(criarElemento('h3', 'Resumo Geral da Proposta'));

    const ulResumo = document.createElement('ul');
    ulResumo.appendChild(criarItemLista('Valor Total do Imóvel', formatarMoeda(proposta.valorTotal)));
    ulResumo.appendChild(
      criarItemLista(
        'Sinal',
        `${formatarMoeda(proposta.valorSinal)} — ${formatarPercentual(proposta.percentualSinal)} (Data: ${formatarData(proposta.dataSinal)})`
      )
    );
    ulResumo.appendChild(
      criarItemLista(
        'Entrada',
        `${formatarMoeda(proposta.valorEntrada)} — ${formatarPercentual(proposta.percentualEntrada)} (Data: ${formatarData(proposta.dataEntrada)})`
      )
    );
    ulResumo.appendChild(
      criarItemLista(
        'Chaves',
        `${formatarMoeda(proposta.valorChaves)} — ${formatarPercentual(proposta.percentualChaves)} (Vencimento: ${formatarData(proposta.dataChaves)})`
      )
    );
    ulResumo.appendChild(
      criarItemLista(
        'Subtotal das Modalidades de Parcelas',
        `${formatarMoeda(proposta.subtotalModalidades)} — ${formatarPercentual(proposta.percentualModalidades)}`
      )
    );
    ulResumo.appendChild(
      criarItemLista(
        'Total Comprometido (Sinal + Entrada + Chaves + Modalidades)',
        `${formatarMoeda(proposta.totalComprometido)} — ${formatarPercentual(proposta.percentualComprometido)}`
      )
    );
    ulResumo.appendChild(
      criarItemLista(
        'Saldo Restante a Cobrir',
        `${formatarMoeda(proposta.saldoRestante)} — ${formatarPercentual(proposta.percentualSaldoRestante)}`
      )
    );
    fragmento.appendChild(ulResumo);

    // Relatório de Pagamentos até as Chaves (se vencimento das chaves estiver preenchido)
    if (proposta.dataChaves) {
      const relatorioChaves = calcularPagamentosAteChaves(proposta, { incluirChaves });

      const fieldsetChaves = document.createElement('fieldset');
      const tituloLegend = `Pagamentos até as Chaves (Data limite: ${formatarData(relatorioChaves.dataLimiteChaves)}) - ${relatorioChaves.incluiuChaves ? 'Incluindo chaves' : 'Sem incluir chaves'}`;
      fieldsetChaves.appendChild(criarElemento('legend', tituloLegend));

      const pTotalChaves = document.createElement('p');
      pTotalChaves.appendChild(
        criarElemento(
          'strong',
          `Total pago no período (${relatorioChaves.incluiuChaves ? 'com chaves' : 'sem chaves'}): `
        )
      );
      pTotalChaves.appendChild(
        document.createTextNode(
          `${formatarMoeda(relatorioChaves.totalAteChaves)} (${formatarPercentual(relatorioChaves.percentualAteChaves)} do valor do imóvel)`
        )
      );
      fieldsetChaves.appendChild(pTotalChaves);

      const detailsChaves = document.createElement('details');
      detailsChaves.open = true;
      detailsChaves.appendChild(criarElemento('summary', 'Ver pagamentos inclusos no cálculo até as chaves'));

      const olChaves = document.createElement('ol');
      relatorioChaves.pagamentosAteChaves.forEach((pag) => {
        const texto = `${pag.descricao}: ${formatarMoeda(pag.valor)} - Data: ${formatarData(pag.vencimento)}`;
        olChaves.appendChild(criarElemento('li', texto));
      });
      detailsChaves.appendChild(olChaves);
      fieldsetChaves.appendChild(detailsChaves);

      if (relatorioChaves.pagamentosAposChaves.length > 0) {
        const detailsPos = document.createElement('details');
        detailsPos.appendChild(
          criarElemento('summary', 'Ver pagamentos não inclusos / pós-chaves')
        );
        const olPos = document.createElement('ol');
        relatorioChaves.pagamentosAposChaves.forEach((pag) => {
          const texto = `${pag.descricao}: ${formatarMoeda(pag.valor)} - Data: ${formatarData(pag.vencimento)}`;
          olPos.appendChild(criarElemento('li', texto));
        });
        detailsPos.appendChild(olPos);
        fieldsetChaves.appendChild(detailsPos);
      }

      fragmento.appendChild(fieldsetChaves);
    }

    fragmento.appendChild(criarElemento('h3', 'Detalhamento das Modalidades de Parcelamento'));

    if (proposta.modalidades.length === 0) {
      fragmento.appendChild(criarElemento('p', 'Nenhuma modalidade de parcelamento informada.'));
    } else {
      proposta.modalidades.forEach((mod, index) => {
        const fieldset = document.createElement('fieldset');
        const legend = criarElemento('legend', `Modalidade ${index + 1}: ${mod.tipo.toUpperCase()}`);
        fieldset.appendChild(legend);

        const pTotal = document.createElement('p');
        pTotal.appendChild(criarElemento('strong', 'Total nesta modalidade: '));
        pTotal.appendChild(
          document.createTextNode(`${formatarMoeda(mod.total)} — ${formatarPercentual(mod.percentual)} do valor total`)
        );
        fieldset.appendChild(pTotal);

        const pQtd = document.createElement('p');
        pQtd.appendChild(criarElemento('strong', 'Quantidade de parcelas: '));
        pQtd.appendChild(document.createTextNode(String(mod.quantidadeParcelas)));
        fieldset.appendChild(pQtd);

        const pData = document.createElement('p');
        pData.appendChild(criarElemento('strong', '1º Vencimento: '));
        pData.appendChild(document.createTextNode(formatarData(mod.dataPrimeiroVencimento)));
        fieldset.appendChild(pData);

        const pPrim = document.createElement('p');
        pPrim.appendChild(criarElemento('strong', '1ª Parcela (com resíduo de centavos/dízima): '));
        pPrim.appendChild(document.createTextNode(formatarMoeda(mod.primeiraParcela)));
        fieldset.appendChild(pPrim);

        const pDemais = document.createElement('p');
        pDemais.appendChild(criarElemento('strong', `Demais Parcelas (${mod.quantidadeParcelas - 1}x): `));
        pDemais.appendChild(document.createTextNode(formatarMoeda(mod.demaisParcelas)));
        fieldset.appendChild(pDemais);

        const details = document.createElement('details');
        const summary = criarElemento('summary', 'Ver cronograma de parcelas');
        details.appendChild(summary);

        const ol = document.createElement('ol');
        mod.parcelas.forEach((item) => {
          const textoParcela = `Parcela ${item.numero}: ${formatarMoeda(item.valor)} - Vencimento: ${formatarData(item.vencimento)}`;
          ol.appendChild(criarElemento('li', textoParcela));
        });
        details.appendChild(ol);

        fieldset.appendChild(details);
        fragmento.appendChild(fieldset);
      });
    }

    resultadoContainer.replaceChildren(fragmento);
  } catch (erro) {
    const pErro = criarElemento('p');
    pErro.style.color = 'red';
    pErro.appendChild(criarElemento('strong', 'Erro: '));
    pErro.appendChild(document.createTextNode(erro.message));
    resultadoContainer.replaceChildren(pErro);
  }
}

// Gerenciamento assíncrono com Debounce nativo
let debounceTimer = null;

function agendarCalculo() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    // Executa no próximo ciclo de animação para manter o navegador fluido
    requestAnimationFrame(() => {
      processarCalculo();
    });
  }, 150); // 150ms após a última digitação
}

// Ouve em tempo real qualquer digitação ou alteração em qualquer campo do formulário
form.addEventListener('input', agendarCalculo);
form.addEventListener('change', agendarCalculo);

// Previne o recarregamento da página caso o usuário pressione Enter
form.addEventListener('submit', (event) => {
  event.preventDefault();
  clearTimeout(debounceTimer);
  processarCalculo();
});
