import { randomInt } from 'crypto';

// Recuperação de senha sem e-mail: o admin gera uma senha temporária e passa pro aluno,
// que entra com ela e troca no perfil.
// Sem letras/números que se confundem (0/O, 1/l/I), pra dar pra ditar ou copiar sem erro.
const CARACTERES = 'abcdefghjkmnpqrstuvwxyz23456789';
const TAMANHO = 10;

// randomInt usa o gerador seguro do Node (Math.random não serve pra senha)
export function gerarSenhaTemporaria() {
    let senha = '';
    for (let i = 0; i < TAMANHO; i++) {
        senha += CARACTERES[randomInt(CARACTERES.length)];
    }
    return senha;
}
