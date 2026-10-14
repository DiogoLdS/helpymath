import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import api from "../../../services/api.js";
import { usuarioEhAdmin } from "../../utils/auth.js";
import layouts, { gerarLayoutPadrao } from "../../data/layouts.js";
import Sidebar from "../Sidebar/SidebarChapeu";
import { TextoComFormulas } from "../Formulas/Formula.jsx";
import "./MapaConceitual.css";

// Página do mapa conceitual: busca o mapa (nome + conteúdos + explicações) direto da API,
// e usa layouts.js só pra decidir onde cada botão fica no grid.
const MapaConceitual = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [mapa, setMapa] = useState(null);
    const [designIndex, setDesignIndex] = useState(0);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [abertoId, setAbertoId] = useState(null);

    useEffect(() => {
        const buscarMapa = async () => {
            const storedToken = localStorage.getItem("token");

            if (!storedToken) {
                navigate("/login");
                return;
            }

            setCarregando(true);
            setErro("");
            setAbertoId(null);

            try {
                const resposta = await api.get(`/mapas/${id}`, {
                    headers: {
                        Authorization: `Bearer ${storedToken}`
                    }
                });

                const dados = resposta.data;

                // Sorteia a variante de design uma vez por carregamento, conforme a quantidade de conteúdos
                const variantes = layouts[dados.conteudos.length] || [];
                setDesignIndex(Math.floor(Math.random() * variantes.length));
                setMapa(dados);
            } catch (error) {
                if (error.response?.status === 401) {
                    navigate("/login");
                    return;
                }

                setErro(
                    error.response?.status === 404
                        ? "Mapa conceitual não encontrado."
                        : "Não foi possível carregar este mapa conceitual."
                );
                console.log(error.message);
            } finally {
                setCarregando(false);
            }
        };

        buscarMapa();
    }, [id]);

    if (carregando) {
        return <p className="mapaMensagem">Carregando...</p>;
    }

    if (erro || !mapa) {
        return <p className="mapaMensagem">{erro || "Não foi possível carregar este mapa conceitual."}</p>;
    }

    const itens = mapa.conteudos;

    if (itens.length === 0) {
        return <p className="mapaMensagem">Este mapa ainda não tem conteúdos cadastrados.</p>;
    }

    // Variante cadastrada em layouts.js; se não existir pra essa quantidade, usa o layout de reserva
    const variantes = layouts[itens.length] || [];
    const layout = variantes[designIndex] || gerarLayoutPadrao(itens.length);

    if (!layout) {
        return <p className="mapaMensagem">Este mapa tem conteúdos demais para o layout atual ({itens.length}).</p>;
    }

    const itemAberto = itens.find((item) => item.conteudoId === abertoId);

    return (
        <div className="mapaConceitualPage">
            <Sidebar />
            <div
                className="mapaGrid"
                style={{
                    gridTemplateRows: `repeat(${layout.rows}, 1fr)`,
                    gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
                }}
            >

                <div className="mapaTitulo">{mapa.nome}</div>

                {itens.map((item, index) => {
                    const posicao = layout.posicoes[index];

                    return (
                        <button
                            type="button"
                            key={item.conteudoId}
                            className="mapaNo"
                            style={{ gridRow: posicao.row, gridColumn: posicao.col }}
                            onClick={() => setAbertoId(item.conteudoId)}
                        >
                            {item.titulo}
                        </button>
                    );
                })}
            </div>

            <div className="mapaAcoes">
                {usuarioEhAdmin() && (
                    <Link to={`/admin/mapas/${id}/editar`} className="mapaEditar">Editar mapa</Link>
                )}
                <Link to={`/mapas/${id}/questoes`} className="mapaQuestoes">Fazer questões</Link>
            </div>

            {itemAberto && (<> <div className="backdrop" onClick={() => setAbertoId(null)} /> <div className="mapaExplicacao"> <h3>{itemAberto.titulo}</h3> <div className="mapaExplicacaoTexto"> {itemAberto.explicacao ? <TextoComFormulas texto={itemAberto.explicacao} /> : "Sem explicação cadastrada ainda."} </div> <button type="button" onClick={() => setAbertoId(null)} > Fechar </button> </div> </>)}
        </div>
    );
};

export default MapaConceitual;