import prisma from './adapter.js';

// Apaga a conta e tudo o que é dela (respostas e conteúdos concluídos), numa transação só:
// ou some tudo, ou nada muda. Usada pelo próprio aluno (LGPD) e pelo admin.
// Devolve "nao-encontrado", "ultimo-admin" ou "ok".
export async function excluirUsuario(usuarioId) {
    const usuario = await prisma.usuario.findUnique({ where: { usuarioId } });
    if (!usuario) return "nao-encontrado";

    // O site não pode ficar sem nenhum administrador
    if (usuario.admin) {
        const admins = await prisma.usuario.count({ where: { admin: true } });
        if (admins <= 1) return "ultimo-admin";
    }

    await prisma.$transaction([
        prisma.usuarioquestao.deleteMany({ where: { usuarioId } }),
        prisma.usuarioconteudo.deleteMany({ where: { usuarioId } }),
        prisma.usuario.delete({ where: { usuarioId } }),
    ]);
    return "ok";
}
