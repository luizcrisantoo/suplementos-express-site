/** Dinheiro sempre em centavos inteiros. Float em preco vira divergencia de centavo. */
export const brl = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Arredonda para o proximo terminado em ,90 (padrao de varejo). */
export const noventa = (cents: number) => Math.floor(cents / 100) * 100 - 10;
