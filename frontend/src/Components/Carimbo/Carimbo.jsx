import "./Carimbo.css";

// Carimbo de professor ("CONCLUÍDO" + data, se souber o dia), meio torto, em tinta vermelha.
// animar = true: "bate" no papel (só quando o mapa acabou de ser concluído; quem volta depois vê ele parado)
const Carimbo = ({ texto = "Concluído", data = null, animar = false }) => (
    <span className={animar ? "carimbo batendo" : "carimbo"} role="img" aria-label={`Carimbo: ${texto}`}>
        <span className="carimboTexto">{texto}</span>
        {data && <span className="carimboData">{data.toLocaleDateString("pt-BR")}</span>}
    </span>
);

export default Carimbo;
