import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import api from "../../../services/api.js";
import "./Mapas.css";

const Mapas = () => {
    const [mapas, setMapas] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const buscarMapas = async () => {
            const storedToken = localStorage.getItem('token');

            if (!storedToken) {
                navigate('/login');
                return;
            }

            try {
                const resposta = await api.get('/mapas', {
                    headers: {
                        Authorization: `Bearer ${storedToken}`
                    }
                });

                setMapas(resposta.data);
            } catch (error) {
                if (error.response?.status === 401) {
                    navigate('/login');
                }
                console.log(error.message);
            }
        };

        buscarMapas();
    }, []);

    return (
        <main className='mainMapas'>
            <h1>Mapas conceituais</h1>

            {mapas.length === 0 && <p>Nenhum mapa conceitual disponível.</p>}

            <div className='mapas-grid'>
                {mapas.map((mapa) => (
                    <Link to={`/mapas/${mapa.mapaId}`} key={mapa.mapaId} className='mapa-card'>
                        <h2>{mapa.nome}</h2>
                    </Link>
                ))}
            </div>
        </main>
    );
};

export default Mapas;
