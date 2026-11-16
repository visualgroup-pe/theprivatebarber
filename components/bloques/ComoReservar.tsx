const PASOS = [
  { titulo: "Solicitas", texto: "Servicio, distrito, día y hora, desde la web o por WhatsApp." },
  { titulo: "El barbero confirma", texto: "Revisa su agenda y acepta. Si ese horario no está libre, te propone otro." },
  { titulo: "Te atendemos", texto: "Llega a tu dirección con todo lo necesario para el servicio." },
  {
    titulo: "Pagas a tu manera",
    texto: "Tarjeta, Yape, Plin, transferencia o efectivo. Boleta o factura electrónica.",
  },
];

export function ComoReservar() {
  return (
    <section aria-labelledby="como-t" className="py-[clamp(100px,11vw,170px)]">
      <div className="contenedor">
        <div className="mb-[clamp(56px,7vw,96px)] flex flex-wrap items-end justify-between gap-6">
          <h2 id="como-t" className="font-serif revelar m-0 text-[clamp(48px,5.8vw,96px)] leading-[0.95] tracking-[-0.03em]">
            Reservar toma
            <br />
            <em className="text-huaca">un minuto.</em>
          </h2>
          <p className="revelar m-0 max-w-[340px] text-[16px] leading-[1.6] text-tabaco">
            Tu cita queda confirmada cuando el barbero la acepta. Te avisamos por WhatsApp.
          </p>
        </div>
        <ol className="steps m-0 list-none p-0">
          {PASOS.map((p, i) => (
            <li key={p.titulo} className="revelar">
              <span
                aria-hidden="true"
                className={`block size-[15px] rounded-full ${i === 0 ? "bg-huaca" : "border border-huaca bg-lino"}`}
              />
              <p className="font-mono mt-[30px] mb-2.5 text-[12px] text-huaca-profundo">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="font-serif mt-0 mb-2.5 text-[32px] leading-none">{p.titulo}</h3>
              <p className="m-0 text-[15px] leading-[1.6] text-tabaco">{p.texto}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
