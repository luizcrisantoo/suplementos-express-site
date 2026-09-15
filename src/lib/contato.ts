/**
 * Canal de atendimento da loja.
 *
 * O numero e publico de proposito: aparece no rodape, no botao flutuante e nos
 * links de duvida de produto. Nao e segredo, entao fica em constante e nao em
 * variavel de ambiente - uma variavel a menos para esquecer de configurar na
 * Netlify e quebrar o botao em producao.
 */
export const WHATSAPP = '5581998080009';

export function linkWhatsapp(mensagem: string): string {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensagem)}`;
}

export const MSG_PADRAO = 'Oi! Vim pelo site da Suplementos Express e queria fazer um pedido.';
