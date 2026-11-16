import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Logo } from "@/components/marca/Logo";
import { Monograma } from "@/components/marca/Monograma";
import { Acordeon } from "@/components/ui/Acordeon";
import { Boton } from "@/components/ui/Boton";
import { Campo, CampoSeleccion } from "@/components/ui/Campo";
import { Chip } from "@/components/ui/Chip";
import { Enlace, EnlaceNav } from "@/components/ui/Enlace";
import { Revelar } from "@/components/ui/Revelar";
import { colores } from "@/lib/tokens";

export const metadata: Metadata = {
  title: "Componentes",
  robots: { index: false, follow: false },
};

const MUESTRAS: Array<[keyof typeof colores, string, string]> = [
  ["obsidiana", "obsidiana", "Fondos oscuros, texto, botón principal"],
  ["tabaco", "tabaco", "Texto secundario sobre claro"],
  ["huaca", "huaca", "Acento, relleno del botón"],
  ["huacaProfundo", "huaca-profundo", "Texto pequeño de acento sobre claro"],
  ["huacaClaro", "huaca-claro", "Acento sobre oscuro"],
  ["lino", "lino", "Fondo base"],
  ["piedra", "piedra", "Secciones alternas"],
  ["garua", "garua", "Texto secundario sobre oscuro"],
];

/** Muestrario de la etapa 1. Solo en desarrollo. */
export default function PaginaComponentes() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main>
      <section className="contenedor py-20">
        <p className="etiqueta m-0 text-huaca-profundo">Etapa 1 · Sistema de diseño</p>
        <h1 className="font-serif mt-6 text-[clamp(78px,14vw,236px)] leading-[0.84] tracking-[-0.04em]">
          Precisión
          <span className="block pl-0 lg:pl-[22%]">
            <em className="text-huaca">en privado.</em>
          </span>
        </h1>

        <h2 className="etiqueta mt-20 mb-6 text-tabaco">Colores</h2>
        <ul className="m-0 grid list-none grid-cols-2 gap-4 p-0 md:grid-cols-4">
          {MUESTRAS.map(([clave, token, uso]) => (
            <li key={token} className="border border-obsidiana/10">
              <div className="h-24" style={{ background: colores[clave] }} />
              <div className="p-3 text-[13px] leading-snug">
                <p className="m-0 font-medium">{token}</p>
                <p className="font-mono m-0 text-tabaco">{colores[clave]}</p>
                <p className="m-0 mt-1 text-tabaco">{uso}</p>
              </div>
            </li>
          ))}
        </ul>

        <h2 className="etiqueta mt-20 mb-6 text-tabaco">Tipografía</h2>
        <div className="grid gap-6">
          <p className="font-serif m-0 text-[64px] leading-none tracking-[-0.03em]">
            Instrument Serif <em className="text-huaca">cursiva</em>
          </p>
          <p className="m-0 max-w-[460px] text-[17px] leading-[1.6] text-tabaco">
            Hanken Grotesk 400. Corte, barba y asesoría de imagen en tu casa, tu oficina o tu hotel.
          </p>
          <p className="m-0 text-[15px] font-medium">Hanken Grotesk 500 · <span className="font-semibold">600</span></p>
          <p className="font-mono m-0 text-[17px]">S/ 200 · 45 min – 1 h · 09:00–21:00</p>
        </div>

        <h2 className="etiqueta mt-20 mb-6 text-tabaco">Marca</h2>
        <div className="flex flex-wrap items-center gap-10">
          <Logo alto={28} />
          <Monograma fondo="claro" ancho={54} />
        </div>

        <h2 className="etiqueta mt-20 mb-6 text-tabaco">Botones y enlaces</h2>
        <div className="flex flex-wrap items-center gap-6">
          <Boton href="#">Reservar una cita</Boton>
          <Boton href="#" pequena>
            Reservar
          </Boton>
          <Boton>Botón real</Boton>
          <Enlace href="#" className="text-tabaco">
            o escríbenos por WhatsApp
          </Enlace>
          <Enlace href="#" flecha>
            Ver todas las reseñas
          </Enlace>
          <nav aria-label="Ejemplo" className="flex gap-[34px] text-[13px] tracking-[0.06em]">
            <EnlaceNav href="#">Servicios</EnlaceNav>
            <EnlaceNav href="#">La visita</EnlaceNav>
          </nav>
        </div>

        <h2 className="etiqueta mt-20 mb-6 text-tabaco">Acordeón</h2>
        <div className="max-w-[860px] border-t border-obsidiana">
          <Acordeon pregunta="¿Qué necesito tener en casa?" abierto>
            Un espacio con buena luz, una silla y un enchufe cerca. El barbero lleva sus herramientas, capa, toallas y lo
            necesario para dejar todo limpio.
          </Acordeon>
          <Acordeon pregunta="¿Atienden en oficinas y hoteles?" ultimo>
            Sí, siempre que el espacio lo permita. Al reservar coordinamos el acceso, quién te recibe y cualquier
            indicación del edificio.
          </Acordeon>
        </div>
      </section>

      <section className="bg-obsidiana py-20 text-lino">
        <div className="contenedor">
          <h2 className="etiqueta mb-6 text-garua">Sobre oscuro</h2>
          <div className="flex flex-wrap items-center gap-6">
            <Boton href="#" variante="clara">
              Enviar solicitud
            </Boton>
            <Logo fondo="oscuro" alto={28} />
            <Monograma ancho={40} />
          </div>

          <form className="mt-14 flex max-w-[760px] flex-col gap-10" aria-label="Ejemplo de formulario">
            <fieldset className="m-0 border-0 p-0">
              <legend className="etiqueta mb-4 p-0 text-garua">Servicio</legend>
              <div className="flex flex-wrap gap-2.5">
                <Chip name="servicio" defaultChecked>
                  Corte a medida
                </Chip>
                <Chip name="servicio">Barba y perfilado</Chip>
                <Chip name="servicio">Corte y barba</Chip>
              </div>
              <div className="mt-3.5 flex flex-wrap gap-2.5">
                <Chip tipo="checkbox" name="asesoria">
                  + Asesoría de imagen · S/ 50
                </Chip>
              </div>
            </fieldset>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-x-7 gap-y-8">
              <CampoSeleccion etiqueta="Distrito" name="distrito" defaultValue="San Isidro">
                <option>San Isidro</option>
                <option>Miraflores</option>
                <option>Santiago de Surco</option>
                <option>San Borja</option>
                <option>La Molina</option>
                <option>Otro distrito</option>
              </CampoSeleccion>
              <Campo etiqueta="Fecha" name="fecha" type="date" />
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-x-7 gap-y-8">
              <Campo etiqueta="Nombre" name="nombre" placeholder="Tu nombre" />
              <Campo
                etiqueta="WhatsApp"
                name="whatsapp"
                type="tel"
                placeholder="9XX XXX XXX"
                error="Escribe un número de 9 dígitos que empiece con 9."
              />
            </div>
          </form>
        </div>
      </section>

      <section className="py-20">
        <div className="contenedor max-w-[460px]">
          <h2 className="etiqueta mb-6 text-tabaco">Sobre claro (pantallas móviles)</h2>
          <fieldset className="m-0 border-0 p-0">
            <legend className="etiqueta-sm mb-2.5 p-0 text-tabaco">Franja</legend>
            <div className="grid grid-cols-2 gap-2">
              <Chip tono="claro" name="franja" caraClassName="w-full">
                Mañana · 9–12
              </Chip>
              <Chip tono="claro" name="franja" caraClassName="w-full" defaultChecked>
                Tarde · 15–18
              </Chip>
              <Chip tono="claro" name="franja" caraClassName="w-full" disabled>
                Noche · 18–21
              </Chip>
            </div>
          </fieldset>
          <div className="mt-6 grid gap-4">
            <Campo tono="claro" etiqueta="Dirección y referencia" name="direccion" placeholder="Calle, número, piso o depto." />
          </div>
        </div>
      </section>

      <section className="bg-piedra py-20">
        <div className="contenedor grid gap-10 md:grid-cols-2">
          <Revelar efecto="cortina" className="marco aspect-[3/2]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/detalle-navaja.jpg" alt="Perfilado con navaja en la nuca de un cliente" />
          </Revelar>
          <Revelar as="p" className="font-serif m-0 self-end text-[clamp(34px,4.3vw,66px)] leading-[1.12]">
            Aparece al hacer scroll.
          </Revelar>
        </div>
      </section>
    </main>
  );
}
