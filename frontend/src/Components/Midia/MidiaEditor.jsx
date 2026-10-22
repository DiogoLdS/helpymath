import { useId, useState } from "react";
import { Midia } from "./Midia.jsx";
import { idVideoYoutube, linkValido, montarMarcacaoMidia } from "./midiaUtils.js";
import "./Midia.css";

// Mini editor de mídia: o admin cola o link de uma imagem ou de um vídeo do YouTube,
// confere a pré-visualização e clica em "Inserir na explicação".
const MidiaEditor = ({ onInserir, disabled }) => {
    const [tipo, setTipo] = useState("imagem");
    const [url, setUrl] = useState("");
    const [descricao, setDescricao] = useState("");
    const [imagemCarregou, setImagemCarregou] = useState(false);
    const idUrl = useId();
    const idDescricao = useId();

    const urlLimpa = url.trim();

    // Diz o que falta pra liberar o botão (vazio = pode inserir)
    let problema = "";
    if (!urlLimpa) {
        problema = "Cole o link da mídia.";
    } else if (!linkValido(urlLimpa)) {
        problema = "O link precisa começar com http:// ou https://";
    } else if (tipo === "video" && !idVideoYoutube(urlLimpa)) {
        problema = "Use um link de vídeo do YouTube (youtube.com/watch?v=... ou youtu.be/...).";
    } else if (tipo === "imagem" && !descricao.trim()) {
        // Texto alternativo é requisito de acessibilidade (RNF007)
        problema = "Escreva uma descrição da imagem (usada por leitores de tela).";
    }

    const trocarTipo = (novoTipo) => {
        setTipo(novoTipo);
        setImagemCarregou(false);
    };

    const trocarUrl = (novaUrl) => {
        setUrl(novaUrl);
        setImagemCarregou(false);
    };

    const inserirNaExplicacao = () => {
        if (problema) return;

        onInserir(montarMarcacaoMidia(tipo, urlLimpa, descricao));
        setUrl("");
        setDescricao("");
        setImagemCarregou(false);
    };

    const mostrarPrevia = urlLimpa && linkValido(urlLimpa) && (tipo === "imagem" || idVideoYoutube(urlLimpa));

    return (
        <div className="midiaEditor">
            <div className="midiaAbas" role="tablist">
                <button
                    type="button"
                    role="tab"
                    aria-selected={tipo === "imagem"}
                    className={tipo === "imagem" ? "midiaAba ativa" : "midiaAba"}
                    onClick={() => trocarTipo("imagem")}
                >
                    Imagem
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={tipo === "video"}
                    className={tipo === "video" ? "midiaAba ativa" : "midiaAba"}
                    onClick={() => trocarTipo("video")}
                >
                    Vídeo do YouTube
                </button>
            </div>

            <label className="midiaRotulo" htmlFor={idUrl}>
                {tipo === "imagem" ? "Link da imagem" : "Link do vídeo"}
            </label>
            <input
                id={idUrl}
                type="url"
                value={url}
                onChange={(e) => trocarUrl(e.target.value)}
                placeholder={tipo === "imagem"
                    ? "Ex: https://site.com/grafico.png"
                    : "Ex: https://www.youtube.com/watch?v=..."}
                disabled={disabled}
            />

            {tipo === "imagem" && (
                <>
                    <label className="midiaRotulo" htmlFor={idDescricao}>Descrição da imagem</label>
                    <input
                        id={idDescricao}
                        type="text"
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        placeholder="Ex: Gráfico de uma parábola com concavidade para cima"
                        disabled={disabled}
                    />
                </>
            )}

            <div className="midiaPrevia" aria-live="polite">
                {mostrarPrevia ? (
                    tipo === "imagem" ? (
                        <img
                            key={urlLimpa}
                            src={urlLimpa}
                            alt={descricao}
                            onLoad={() => setImagemCarregou(true)}
                            onError={() => setImagemCarregou(false)}
                        />
                    ) : (
                        <Midia tipo="video" url={urlLimpa} />
                    )
                ) : (
                    <span className="midiaPreviaVazia">A pré-visualização da mídia aparece aqui.</span>
                )}
            </div>

            {tipo === "imagem" && mostrarPrevia && !imagemCarregou && (
                <p className="midiaAviso">
                    Se a imagem não aparecer acima, o link pode não ser de uma imagem direta
                    (clique com o botão direito na imagem e use "Copiar endereço da imagem").
                </p>
            )}

            <div className="midiaAcoes">
                {problema && urlLimpa && <span className="midiaAviso">{problema}</span>}
                <button
                    type="button"
                    className="botaoSecundario"
                    onClick={inserirNaExplicacao}
                    disabled={disabled || Boolean(problema)}
                >
                    Inserir na explicação
                </button>
            </div>
        </div>
    );
};

export default MidiaEditor;
