import { Asesoria } from "@/components/bloques/Asesoria";
import { Barberos } from "@/components/bloques/Barberos";
import { Carta } from "@/components/bloques/Carta";
import { ComoReservar } from "@/components/bloques/ComoReservar";
import { Hero } from "@/components/bloques/Hero";
import { LaVisita } from "@/components/bloques/LaVisita";
import { Manifiesto } from "@/components/bloques/Manifiesto";
import { NavFija } from "@/components/bloques/NavFija";
import { Pie } from "@/components/bloques/Pie";
import { Preguntas } from "@/components/bloques/Preguntas";
import { Resenas } from "@/components/bloques/Resenas";
import { Reserva } from "@/components/bloques/Reserva";
import { Zonas } from "@/components/bloques/Zonas";

/** Portada: orden de bloques del lienzo (referencia/diseno/Main.dc.html). */
export default function Portada() {
  return (
    <div className="pagina">
      <NavFija />
      <main>
        <Hero />
        <Manifiesto />
        <LaVisita />
        <Carta />
        <Asesoria />
        <ComoReservar />
        <Barberos />
        <Zonas />
        <Resenas />
        <Preguntas />
        <Reserva />
      </main>
      <Pie />
    </div>
  );
}
