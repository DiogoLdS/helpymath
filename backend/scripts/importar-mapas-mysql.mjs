// Traz os mapas antigos do MySQL (o banco que o site usava antes do Neon) para o PostgreSQL do Neon:
// mapas, conteúdos, questões e alternativas. Contas e progresso NÃO são importados.
//
// Como usar (dentro da pasta backend):
//   1. No .env, acrescente a URL do MySQL antigo:
//        MYSQL_ANTIGO_URL="mysql://usuario:senha@host:3306/nome_do_banco"
//      Se o MySQL antigo exigia SSL (o Render usava DATABASE_SSL=true), acrescente também:
//        MYSQL_ANTIGO_SSL=true
//   2. Simulação (não grava nada, só mostra o que seria importado):
//        node scripts/importar-mapas-mysql.mjs
//   3. Importação de verdade:
//        node scripts/importar-mapas-mysql.mjs --confirmar
//
// Os mapas entram no Neon com IDs novos (o Neon já tem dados, então os IDs antigos poderiam bater).
// Mapas com o mesmo nome de um que já existe no Neon são pulados, pra não duplicar.
// Tudo é gravado numa transação só: se algo falhar no meio, nada fica pela metade.

import "dotenv/config";
import mariadb from "mariadb";
import prisma from "../services/adapter.js";

const confirmar = process.argv.includes("--confirmar");
const NIVEIS = ["basico", "intermediario", "avancado", "treino"];

if (!process.env.MYSQL_ANTIGO_URL) {
    console.error("Falta a variável MYSQL_ANTIGO_URL no .env (a URL do MySQL antigo). Veja as instruções no topo deste arquivo.");
    process.exit(1);
}

// ---------- 1. Lê tudo do MySQL antigo ----------

const url = new URL(process.env.MYSQL_ANTIGO_URL);
const mysql = await mariadb.createConnection({
    host: url.hostname,
    port: Number(url.port) || 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    ssl: process.env.MYSQL_ANTIGO_SSL === "true" ? { rejectUnauthorized: false } : undefined,
    // O padrão do driver é 1 segundo, pouco pra um banco gratuito que acabou de ser religado
    connectTimeout: 30000,
    // tinyint(1) vira true/false, como o Prisma fazia
    bitOneIsBoolean: true,
});

let antigo;
try {
    // SELECT * de propósito: um banco antigo pode não ter colunas novas (ex: "nivel"), e aí elas vêm vazias
    antigo = {
        mapas: await mysql.query("SELECT * FROM mapaconceitual ORDER BY mapaId"),
        vinculos: await mysql.query("SELECT * FROM mapaconteudo ORDER BY mapaId, conteudoId"),
        conteudos: await mysql.query("SELECT * FROM conteudo"),
        questoes: await mysql.query("SELECT * FROM questao ORDER BY questaoId"),
        alternativas: await mysql.query("SELECT * FROM alternativa ORDER BY id"),
    };
} finally {
    await mysql.end();
}

const conteudoPorId = new Map(antigo.conteudos.map((c) => [c.conteudoId, c]));

// ---------- 2. Decide o que entra (pula nomes que o Neon já tem) ----------

const existentes = await prisma.mapaconceitual.findMany({ select: { nome: true } });
const nomesExistentes = new Set(existentes.map((m) => m.nome.trim().toLowerCase()));

const plano = antigo.mapas.map((mapa) => {
    const conteudos = antigo.vinculos
        .filter((v) => v.mapaId === mapa.mapaId)
        .map((v) => conteudoPorId.get(v.conteudoId))
        .filter(Boolean);
    const questoes = antigo.questoes
        .filter((q) => q.mapaId === mapa.mapaId)
        .map((q) => ({ ...q, alternativas: antigo.alternativas.filter((a) => a.questaoId === q.questaoId) }));

    return {
        mapa,
        // Mapa sem nível (banco antigo) ou com nível desconhecido entra como básico, o padrão do site
        nivel: NIVEIS.includes(mapa.nivel) ? mapa.nivel : "basico",
        conteudos,
        questoes,
        pular: nomesExistentes.has(String(mapa.nome).trim().toLowerCase()),
    };
});

console.log(`\nMySQL antigo: ${antigo.mapas.length} mapa(s), ${antigo.conteudos.length} conteúdo(s), ${antigo.questoes.length} questão(ões).\n`);
for (const item of plano) {
    const resumo = `${item.conteudos.length} conteúdo(s), ${item.questoes.length} questão(ões), nível ${item.nivel}`;
    console.log(item.pular
        ? `  PULA     "${item.mapa.nome}" (já existe um mapa com esse nome no Neon)`
        : `  IMPORTA  "${item.mapa.nome}": ${resumo}`);
}

const aImportar = plano.filter((item) => !item.pular);

if (!confirmar) {
    console.log(`\nSimulação: nada foi gravado. ${aImportar.length} mapa(s) seriam importados.`);
    console.log("Para importar de verdade: node scripts/importar-mapas-mysql.mjs --confirmar\n");
    await prisma.$disconnect();
    process.exit(0);
}

if (aImportar.length === 0) {
    console.log("\nNada para importar.\n");
    await prisma.$disconnect();
    process.exit(0);
}

// ---------- 3. Grava no Neon, numa transação só ----------

// Um mesmo conteúdo pode estar em mais de um mapa: ele é criado uma vez só e ligado aos mapas
const conteudoNovoPorAntigo = new Map();
let totais = { mapas: 0, conteudos: 0, questoes: 0, alternativas: 0 };

await prisma.$transaction(async (tx) => {
    for (const item of aImportar) {
        const novoMapa = await tx.mapaconceitual.create({
            data: { nome: item.mapa.nome, nivel: item.nivel },
        });
        totais.mapas += 1;

        for (const conteudo of item.conteudos) {
            if (!conteudoNovoPorAntigo.has(conteudo.conteudoId)) {
                const novo = await tx.conteudo.create({
                    data: { titulo: conteudo.titulo, tipo: conteudo.tipo, explicacao: conteudo.explicacao ?? null },
                });
                conteudoNovoPorAntigo.set(conteudo.conteudoId, novo.conteudoId);
                totais.conteudos += 1;
            }

            await tx.mapaconteudo.create({
                data: { mapaId: novoMapa.mapaId, conteudoId: conteudoNovoPorAntigo.get(conteudo.conteudoId) },
            });
        }

        for (const questao of item.questoes) {
            const novaQuestao = await tx.questao.create({
                data: { mapaId: novoMapa.mapaId, data: new Date(questao.data), enunciado: questao.enunciado },
            });
            totais.questoes += 1;

            for (const alternativa of questao.alternativas) {
                await tx.alternativa.create({
                    data: {
                        questaoId: novaQuestao.questaoId,
                        texto: alternativa.texto,
                        letra: alternativa.letra,
                        correta: Boolean(alternativa.correta),
                    },
                });
                totais.alternativas += 1;
            }
        }
    }
}, { timeout: 120000, maxWait: 20000 });

console.log(`\nImportação concluída: ${totais.mapas} mapa(s), ${totais.conteudos} conteúdo(s), ${totais.questoes} questão(ões), ${totais.alternativas} alternativa(s).\n`);
await prisma.$disconnect();
