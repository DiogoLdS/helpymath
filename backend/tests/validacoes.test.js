// Regras sem banco: cadastro, edição do perfil, senha temporária e limite de login.
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';

// perfil.js importa o banco: troca por um falso (estes testes não consultam nada)
mock.module(new URL('../services/adapter.js', import.meta.url).href, { exports: { default: {} } });

const { validarCadastro, validarEdicaoPerfil } = await import('../services/perfil.js');
const { gerarSenhaTemporaria } = await import('../services/senhaTemporaria.js');
const limite = await import('../services/limiteLogin.js');

test('cadastro: aceita dados certos e deixa o e-mail em minúsculas', () => {
    const { dados, erro } = validarCadastro({ nome: '  Ana Souza ', email: ' Ana@Email.com ', senha: '123456', aceitouTermos: true });
    assert.equal(erro, undefined);
    assert.deepEqual(dados, { nome: 'Ana Souza', email: 'ana@email.com', senha: '123456' });
});

test('cadastro: recusa nome curto, e-mail inválido, senha curta e termos não aceitos', () => {
    const base = { nome: 'Ana', email: 'ana@x.com', senha: '123456', aceitouTermos: true };
    assert.match(validarCadastro({ ...base, nome: 'A' }).erro, /nome/);
    assert.match(validarCadastro({ ...base, email: 'ana@x' }).erro, /e-mail/);
    assert.match(validarCadastro({ ...base, senha: '12345' }).erro, /senha/);
    assert.match(validarCadastro({ ...base, aceitouTermos: 'sim' }).erro, /Termos/);
});

test('perfil: só passa o que foi mandado e confere cada campo', () => {
    assert.deepEqual(validarEdicaoPerfil({ metaSemanal: '7' }).dados, { metaSemanal: 7 });
    assert.match(validarEdicaoPerfil({ metaSemanal: 0 }).erro, /meta/);
    assert.match(validarEdicaoPerfil({ objetivo: 'hackear' }).erro, /Objetivo/);
    assert.match(validarEdicaoPerfil({ nivel: 'impossivel' }).erro, /Nível/);
    assert.match(validarEdicaoPerfil({ anotacoes: 'x'.repeat(5001) }).erro, /anotações/);
    assert.deepEqual(validarEdicaoPerfil({ objetivo: null }).dados, { objetivo: null });
});

test('perfil: cronograma guarda só os 7 dias, e não aceita lista', () => {
    const { dados } = validarEdicaoPerfil({ cronograma: { seg: ' Frações ', xyz: 'ignorado' } });
    assert.deepEqual(Object.keys(dados.cronograma), ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom']);
    assert.equal(dados.cronograma.seg, 'Frações');
    assert.match(validarEdicaoPerfil({ cronograma: ['seg'] }).erro, /Cronograma/);
});

test('senha temporária: 10 caracteres, sem os que se confundem (0, O, 1, l, I)', () => {
    const senhas = Array.from({ length: 200 }, gerarSenhaTemporaria);
    for (const s of senhas) assert.match(s, /^[a-hjkmnp-z2-9]{10}$/);
    assert.ok(new Set(senhas).size > 190, 'as senhas precisam variar');
});

test('limite de login: trava no 5º erro (mesmo e-mail e IP) e destrava depois de 15 min', () => {
    const t0 = 1_000_000;
    for (let i = 0; i < limite.MAX_ERROS - 1; i++) limite.registrarErro('1.1.1.1', 'Ana@x.com ', t0);
    assert.equal(limite.minutosBloqueado('1.1.1.1', 'ana@x.com', t0), 0);
    limite.registrarErro('1.1.1.1', 'ana@x.com', t0);
    assert.equal(limite.minutosBloqueado('1.1.1.1', 'ana@x.com', t0), 15);
    assert.equal(limite.minutosBloqueado('2.2.2.2', 'ana@x.com', t0), 0, 'outro IP não trava');
    assert.equal(limite.minutosBloqueado('1.1.1.1', 'bia@x.com', t0), 0, 'outro e-mail não trava');
    assert.equal(limite.minutosBloqueado('1.1.1.1', 'ana@x.com', t0 + limite.JANELA_MS), 0);
});

test('limite de login: acertar a senha zera a contagem', () => {
    for (let i = 0; i < 4; i++) limite.registrarErro('3.3.3.3', 'c@x.com');
    limite.limparErros('3.3.3.3', 'c@x.com');
    limite.registrarErro('3.3.3.3', 'c@x.com');
    assert.equal(limite.minutosBloqueado('3.3.3.3', 'c@x.com'), 0);
});
