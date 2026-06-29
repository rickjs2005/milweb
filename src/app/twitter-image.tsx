// Reaproveita o mesmo visual do Open Graph para o card do Twitter/X.
// Só o `default` (gerador) é re-exportado; os metadados são declarados aqui
// porque o Next precisa lê-los estaticamente neste arquivo.
export { default } from './opengraph-image';

export const dynamic = 'force-dynamic';
export const alt = 'MilWeb — Sites e sistemas que dão resultado';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
