export function convertToCents(decimalValue) {
    return Math.round(decimalValue * 100);
}

export function convertToCub(imovel, cub) {
    return imovel / cub;
}

export function calculate(imovel, cub) {
    let convertImovel = convertToCents(imovel);
    let convertCub = convertToCents(cub);
    let equivalenciaCub = convertImovel / convertCub;

    return equivalenciaCub;
}