import { Enlace } from "@/components/ui/Enlace";
import { Foto } from "@/components/ui/Foto";

const PUNTOS = [
  "Lectura de rostro, facciones y tipo de cabello",
  "Propuesta de corte y barba según tu agenda",
  "Rutina para mantenerlo entre citas",
  "Una ficha personal: la próxima vez, sin repetir explicaciones",
];
const ROMANOS = ["i.", "ii.", "iii.", "iv."];

export function Asesoria() {
  return (
    <section aria-labelledby="ases-t" className="bg-piedra py-[clamp(90px,10vw,160px)]">
      <div className="contenedor ases">
        <Foto
          src="/img/ejecutivo-ventana.jpg"
          alt="Hombre de traje junto a una ventana con cortinas"
          sizes="(min-width: 961px) 60vw, 100vw"
          aspecto="4 / 3"
          posicion="28% center"
          cortina
        />
        <div className="ases-card revelar bg-lino p-[clamp(36px,4.5vw,72px)]">
          <p className="etiqueta mt-0 mb-[22px] text-huaca-profundo">Asesoría de imagen</p>
          <h2 id="ases-t" className="font-serif m-0 text-[clamp(38px,3.8vw,60px)] leading-none tracking-[-0.02em]">
            Cómo quieres verte el lunes a las nueve.
          </h2>
          <p className="mt-6 mb-0 text-[16px] leading-[1.6] text-tabaco">
            Es un plan hecho para ti, que el barbero te propone y explica durante la atención. Parte de tu vida real: lo
            que haces, con quién te reúnes y cuánto tiempo le das al espejo cada mañana.
          </p>
          <ol className="mt-7 mb-0 list-none p-0 text-[15px]">
            {PUNTOS.map((punto, i) => (
              <li
                key={punto}
                className={`flex gap-4 border-t border-piedra py-[13px] ${i === PUNTOS.length - 1 ? "border-b" : ""}`}
              >
                <em className="font-serif w-[22px] shrink-0 text-[18px] text-huaca-profundo">{ROMANOS[i]}</em>
                {punto}
              </li>
            ))}
          </ol>
          <Enlace href="#reserva" flecha className="mt-[26px] text-obsidiana">
            Añadirla a tu cita
          </Enlace>
        </div>
      </div>
    </section>
  );
}
