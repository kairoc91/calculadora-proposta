export function convertToCents(decimalValue) {
    return Math.round(decimalValue * 100);
}

export function convertToCub(valorTotal, cub) {
    return valorTotal / cub;
}

export function calculaProposta(valorTotal, valorEntrada, quantidadeParcela) {
    const saldo = valorTotal - valorEntrada;
    const valorParcela = saldo / quantidadeParcela;

    return {
        valorTotal,
        valorEntrada,
        saldo,
        quantidadeParcela,
        valorParcela
    };
}