import { Fragment } from "react";
import { TextoComFormulas } from "../Formulas/Formula.jsx";
import { idVideoYoutube, linkValido } from "./midiaUtils.js";
import "./Midia.css";

// A mídia fica guardada dentro do próprio texto da explicação, igual às fórmulas:
//   [[imagem:https://site.com/figura.png|Descrição da imagem]]
//   [[video:https://www.youtube.com/watch?v=XXXXXXXXXXX]]
// Assim não precisa de coluna nova no banco nem de servidor de arquivos.
const PADRAO_MIDIA = /(\[\[(?:imagem|video):[^\]\n]+\]\])/g;

export function Midia({ tipo, url, descricao }) {
    if (!linkValido(url)) {
        return <p className="midiaErro">Link de mídia inválido.</p>;
    }

    if (tipo === "imagem") {
        return (
            <figure className="midiaBloco">
                <img src={url} alt={descricao} loading="lazy" />
                {descricao && <figcaption>{descricao}</figcaption>}
            </figure>
        );
    }

    const idVideo = idVideoYoutube(url);
    if (!idVideo) {
        return <p className="midiaErro">Esse link não é de um vídeo do YouTube.</p>;
    }

    return (
        <div className="midiaBloco midiaVideo">
            <iframe
                src={`https://www.youtube-nocookie.com/embed/${idVideo}`}
                title="Vídeo do conteúdo"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            />
        </div>
    );
}

// Igual ao TextoComFormulas, mas antes separa as marcações de mídia.
// Como o split usa um grupo de captura, as mídias ficam sempre nas posições ímpares.
export function TextoComMidia({ texto }) {
    const partes = texto.split(PADRAO_MIDIA);

    return (
        <>
            {partes.map((parte, i) => {
                if (i % 2 === 1) {
                    const [, tipo, resto] = parte.match(/^\[\[(imagem|video):(.+)\]\]$/);
                    const [url, ...descricao] = resto.split("|");
                    return <Midia key={i} tipo={tipo} url={url} descricao={descricao.join("|").trim()} />;
                }

                // A quebra de linha colada na mídia só atrapalha (a mídia já ocupa a linha toda)
                let textoNormal = parte;
                if (i > 0) textoNormal = textoNormal.replace(/^\n/, "");
                if (i < partes.length - 1) textoNormal = textoNormal.replace(/\n$/, "");

                return <Fragment key={i}><TextoComFormulas texto={textoNormal} /></Fragment>;
            })}
        </>
    );
}
