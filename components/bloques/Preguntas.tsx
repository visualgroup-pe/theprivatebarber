import { Acordeon } from "@/components/ui/Acordeon";
import { preguntas } from "@/content/preguntas";

export function Preguntas() {
  return (
    <section id="preguntas" aria-labelledby="faq-t" className="bg-piedra py-[clamp(100px,11vw,170px)]">
      <div className="contenedor faq">
        <div>
          <h2 id="faq-t" className="font-serif revelar m-0 text-[clamp(52px,6vw,100px)] leading-[0.92] tracking-[-0.03em]">
            Preguntas
          </h2>
          <p className="revelar mt-6 mb-0 max-w-[300px] text-[16px] leading-[1.6] text-tabaco">
            ¿Otra duda? Escríbenos por WhatsApp en horario de atención.
          </p>
        </div>
        <div className="border-t border-obsidiana">
          {preguntas.map((p, i) => (
            <Acordeon key={p.pregunta} pregunta={p.pregunta} abierto={i === 0} ultimo={i === preguntas.length - 1}>
              <p className="m-0">{p.respuesta}</p>
            </Acordeon>
          ))}
        </div>
      </div>
    </section>
  );
}
