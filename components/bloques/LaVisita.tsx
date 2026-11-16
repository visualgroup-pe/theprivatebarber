import { Foto } from "@/components/ui/Foto";

const TIEMPOS = [
  {
    n: "i.",
    titulo: "Llegada",
    texto: "Puntual y discreto. Elegimos el rincón con mejor luz y protegemos el piso antes de abrir el maletín.",
    src: "/img/herramientas.jpg",
    alt: "Herramientas de barbería listas sobre un paño",
    posicion: "65% center",
  },
  {
    n: "ii.",
    titulo: "Conversación",
    texto: "Antes de tocar el cabello, hablamos: tu rostro, tu semana, cómo quieres verte.",
    src: "/img/peinado.jpg",
    alt: "Barbero peinando el cabello de un cliente antes del corte",
    posicion: "60% center",
  },
  {
    n: "iii.",
    titulo: "El oficio",
    texto: "Tijera, máquina y navaja, con el tiempo que cada detalle necesita. Sin el reloj del siguiente turno.",
    src: "/img/corte-ventana.jpg",
    alt: "Corte con tijera junto a la ventana",
    posicion: undefined,
  },
  {
    n: "iv.",
    titulo: "Cierre",
    texto:
      "Recogemos cada cabello, te dejamos indicaciones para mantener el corte y guardamos tu ficha para la próxima vez.",
    src: "/img/barba.jpg",
    alt: "Arreglo de barba con tijera y peine",
    posicion: "40% center",
  },
];

export function LaVisita() {
  return (
    <section
      id="visita"
      aria-labelledby="vis-t"
      className="bg-piedra pt-[clamp(100px,11vw,170px)] pb-[clamp(80px,9vw,130px)]"
    >
      <div className="contenedor mb-[clamp(48px,6vw,84px)] flex flex-wrap items-end justify-between gap-8">
        <h2 id="vis-t" className="font-serif revelar m-0 text-[clamp(52px,6.6vw,112px)] leading-[0.92] tracking-[-0.03em]">
          La visita,
          <br />
          en cuatro tiempos.
        </h2>
        <div className="revelar max-w-[360px]">
          <p className="m-0 text-[17px] leading-[1.6] text-tabaco">
            Una hora pensada como una prueba en sastrería: se mide, se conversa, se trabaja y se ajusta.
          </p>
          <p className="etiqueta mt-[22px] mb-0 text-huaca-profundo">Desliza →</p>
        </div>
      </div>
      <div className="rail" role="list" tabIndex={0} aria-label="Los cuatro tiempos de la visita">
        {TIEMPOS.map((t) => (
          <article key={t.titulo} role="listitem" className="revelar">
            <Foto src={t.src} alt={t.alt} posicion={t.posicion} sizes="(min-width: 961px) 30vw, 280px" aspecto="3 / 4" />
            <p className="font-serif mt-[26px] mb-0 text-[22px] text-huaca-profundo">
              <em>{t.n}</em>
            </p>
            <h3 className="font-serif mt-1 mb-2.5 text-[38px] leading-none">{t.titulo}</h3>
            <p className="m-0 text-[16px] leading-[1.6] text-tabaco">{t.texto}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
