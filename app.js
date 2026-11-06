import {
  criarProposta,
  criarSinal,
  criarChaves,
  criarParcelasMensais,
  criarParcelasTrimestrais,
  criarParcelasSemestrais,
  criarParcelasAnuais,
} from './index.js';

function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

const form = document.getElementById('proposta-form');
const resultadoContainer = document.getElementById('resultado');

form.addEventListener('submit', (event) => {
  event.preventDefault();

  try {
    const valorTotal = Number(document.getElementById('valorTotal').value);
    const valorEntrada = Number(document.getElementById('valorEntrada').value || 0);
    const valorSinal = Number(document.getElementById('valorSinal').value || 0);
    const valorChaves = Number(document.getElementById('valorChaves').value || 0);
    const tipoParcelamento = document.getElementById('tipoParcelamento').value;
    const quantidadeParcelas = Number(document.getElementById('quantidadeParcelas').value);

    const proposta = criarProposta(valorTotal, valorEntrada);
    const sinal = criarSinal(valorSinal);
    const chaves = criarChaves(valorChaves);

    const deductions = valorEntrada + valorSinal + valorChaves;
    if (deductions > valorTotal) {
      throw new RangeError('A soma de entrada, sinal e chaves não pode exceder o valor total do imóvel.');
    }

    const saldoParaParcelar = valorTotal - deductions;

    let parcelamento;
    switch (tipoParcelamento) {
      case 'trimestral':
        parcelamento = criarParcelasTrimestrais(saldoParaParcelar, quantidadeParcelas);
        break;
      case 'semestral':
        parcelamento = criarParcelasSemestrais(saldoParaParcelar, quantidadeParcelas);
        break;
      case 'anual':
        parcelamento = criarParcelasAnuais(saldoParaParcelar, quantidadeParcelas);
        break;
      case 'mensal':
      default:
        parcelamento = criarParcelasMensais(saldoParaParcelar, quantidadeParcelas);
        break;
    }

    resultadoContainer.innerHTML = `
      <h3>Resumo da Proposta</h3>
      <ul>
        <li><strong>Valor Total do Imóvel:</strong> ${formatarMoeda(proposta.valorTotal)}</li>
        <li><strong>Valor de Entrada:</strong> ${formatarMoeda(proposta.valorEntrada)} (${proposta.percentualEntrada.toFixed(2)}%)</li>
        <li><strong>Valor de Sinal:</strong> ${formatarMoeda(sinal.valor)}</li>
        <li><strong>Valor nas Chaves:</strong> ${formatarMoeda(chaves.valor)}</li>
        <li><strong>Saldo Restante a Parcelar:</strong> ${formatarMoeda(saldoParaParcelar)}</li>
      </ul>

      <h3>Plano de Pagamento (${parcelamento.tipo.toUpperCase()})</h3>
      <p><strong>Total de Parcelas:</strong> ${parcelamento.quantidadeParcelas}</p>
      <p><strong>1ª Parcela (com resíduo de centavos/dízima):</strong> ${formatarMoeda(parcelamento.primeiraParcela)}</p>
      <p><strong>Demais Parcelas (${parcelamento.quantidadeParcelas - 1}x):</strong> ${formatarMoeda(parcelamento.demaisParcelas)}</p>

      <details>
        <summary>Ver lista completa de parcelas</summary>
        <ol>
          ${parcelamento.parcelas
            .map((p, i) => `<li>Parcela ${i + 1}: ${formatarMoeda(p)}</li>`)
            .join('')}
        </ol>
      </details>
    `;
  } catch (erro) {
    resultadoContainer.innerHTML = `<p style="color: red;"><strong>Erro:</strong> ${erro.message}</p>`;
  }
});

