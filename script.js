const valorImovel = 500000;
const valorCUB = 3182.95;

export function convertToCents(value) {
    let cents = value * 100;
    return cents;
}

export function convertToCub(imovel, cub) {
    let convert = convertToCents(imovel) / convertToCents(cub);
    return convert;
}

console.log(convertToCub(valorImovel, valorCUB).toFixed(6));
