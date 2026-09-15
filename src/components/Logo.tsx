import Image from 'next/image';

/**
 * Logotipo da loja. O arquivo tem fundo transparente e o "EXPRESS" e branco,
 * entao a versao padrao e para superficie escura. Em fundo claro use tom="claro".
 */
export default function Logo({
  altura = 34,
  tom = 'escuro',
  className = '',
  prioridade = false,
}: {
  altura?: number;
  tom?: 'escuro' | 'claro';
  className?: string;
  prioridade?: boolean;
}) {
  const arquivo = tom === 'claro' ? '/marca/logo-claro.png' : '/marca/logo.png';
  const largura = Math.round((293 / 112) * altura);

  return (
    <Image
      src={arquivo}
      alt="Suplementos Express"
      width={largura}
      height={altura}
      priority={prioridade}
      className={className}
      style={{ height: altura, width: 'auto' }}
    />
  );
}
