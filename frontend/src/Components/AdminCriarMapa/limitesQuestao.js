// Tamanho máximo da resolução comentada e da fonte das questões.
// Precisam bater com o backend (services/resolucao.js); o teste de consistência confere.
// Ficam num arquivo só deles porque questoesUtils.js importa a API (que não roda nos testes).
export const MAX_RESOLUCAO = 5000;
export const MAX_FONTE = 60;
