import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import api from "../../../services/api.js";
import "./MapaDetalhe.css";

const MapaDetalhe = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [mapa, setMapa] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(false);

    useEffect(() => {
        const buscarMapa = async () => {
            const storedToken = localStorage.getItem('token');

            if (!storedToken) {
                navigate('/login');
                return;
            }

            try {
                const resposta = await api.get(`/mapas/${id}`, {
                    headers: {
                        Authorization: `Bearer ${storedToken}`
                    }
                });

                setMapa(resposta.data);
            } catch (error) {
                if (error.response?.status === 401) {
                    navigate('/login');
                    return;
                }
                setErro(true);
                console.log(error.message);
            } finally {
                setCarregando(false);
            }
        };

        buscarMapa();
    }, [id]);

    if (carregando) {
        return (
            <main className='mainMapaDetalhe'>
                <p>Carregando...</p>
            </main>
        );
    }

    if (erro || !mapa) {
        return (
            <main className='mainMapaDetalhe'>
                <p>Não foi possível carregar este mapa conceitual.</p>
            </main>
        );
    }

    return (
        <main className='mainMapaDetalhe'>
            <h1>{mapa.nome}</h1>

            <section className='conteudos'>
                {mapa.conteudos.length === 0 && <p>Nenhum conteúdo cadastrado neste mapa.</p>}

                {mapa.conteudos.map((conteudo) => (
                    <div className='conteudo-card' key={conteudo.conteudoId}>
                        <p>{conteudo.titulo}</p>
                    </div>
                ))}
            </section>

            <Link to={`/mapas/${id}/questoes`} className='botao-questoes'>Fazer questões</Link>
        </main>
    );
};

export default MapaDetalhe;
