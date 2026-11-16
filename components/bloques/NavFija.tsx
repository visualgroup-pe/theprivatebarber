import Link from "next/link";
import { Logo } from "@/components/marca/Logo";
import { Boton } from "@/components/ui/Boton";
import { EnlaceNav } from "@/components/ui/Enlace";

type Props = {
  /** En la portada los enlaces son anclas (#); en otras páginas, /#ancla. */
  enPortada?: boolean;
  actual?: "resenas";
};

export function NavFija({ enPortada = true, actual }: Props) {
  const a = (ancla: string) => (enPortada ? `#${ancla}` : `/#${ancla}`);
  return (
    <div className="sticky top-0 z-[70] border-b border-obsidiana/[0.08] bg-[rgba(238,233,225,0.88)] backdrop-blur-[16px] backdrop-saturate-[1.2]">
      <nav aria-label="Principal" className="contenedor nav">
        <div className="nav__izq">
          <EnlaceNav href={a("servicios")}>Servicios</EnlaceNav>
          <EnlaceNav href={a("visita")}>La visita</EnlaceNav>
          <EnlaceNav href={a("barberos")}>Barberos</EnlaceNav>
        </div>
        <Link href={a("inicio")} className="nav__logo block leading-none" aria-label="The Private Barber, inicio">
          <Logo alto={28} alt="The Private Barber" eager />
        </Link>
        <div className="nav__der">
          <EnlaceNav
            href={enPortada ? "#resenas" : "/resenas"}
            aria-current={actual === "resenas" ? "page" : undefined}
            className="solo-escritorio"
          >
            Reseñas
          </EnlaceNav>
          <EnlaceNav href={a("preguntas")} className="solo-escritorio">
            Preguntas
          </EnlaceNav>
          <Boton href={a("reserva")} pequena>
            Reservar
          </Boton>
        </div>
      </nav>
    </div>
  );
}
