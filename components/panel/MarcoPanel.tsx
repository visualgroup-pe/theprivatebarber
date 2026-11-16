import Link from "next/link";
import type { ReactNode } from "react";
import { salir } from "@/app/ingresar/acciones";
import { Logo } from "@/components/marca/Logo";
import { EnlaceNav } from "@/components/ui/Enlace";
import type { Usuario } from "@/lib/auth";

type Props = {
  titulo: string;
  inicio: string;
  enlaces?: Array<{ href: string; texto: string }>;
  usuario: Usuario;
  children: ReactNode;
};

/** Marco de los paneles: barra Obsidiana con marca, navegación y salida. */
export function MarcoPanel({ titulo, inicio, enlaces = [], usuario, children }: Props) {
  return (
    <div className="min-h-dvh bg-lino text-obsidiana">
      <header className="bg-obsidiana text-lino">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-x-8 gap-y-3 px-5 py-4 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href={inicio} aria-label={`${titulo}, inicio`} className="leading-none">
              <Logo fondo="oscuro" alto={18} eager />
            </Link>
            <span className="etiqueta-sm text-garua">{titulo}</span>
          </div>
          <div className="flex items-center gap-5 text-[13px]">
            <span className="text-garua">{usuario.nombre || usuario.email}</span>
            <form action={salir}>
              <button
                type="submit"
                className="min-h-11 cursor-pointer border-0 bg-transparent p-0 text-[13px] text-lino underline underline-offset-4"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
        {enlaces.length > 0 && (
          <nav aria-label="Secciones" className="border-t border-lino/10">
            <div className="mx-auto flex max-w-[1180px] gap-6 overflow-x-auto px-5 text-[13px] tracking-[0.06em] lg:px-8">
              {enlaces.map((e) => (
                <EnlaceNav key={e.href} href={e.href} className="flex min-h-12 shrink-0 items-center">
                  {e.texto}
                </EnlaceNav>
              ))}
            </div>
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-[1180px] px-5 pt-10 pb-24 lg:px-8">{children}</main>
    </div>
  );
}

export function TituloPanel({ etiqueta, children }: { etiqueta?: string; children: ReactNode }) {
  return (
    <div className="mb-10">
      {etiqueta && <p className="etiqueta-sm m-0 mb-3 text-huaca-profundo">{etiqueta}</p>}
      <h1 className="font-serif m-0 text-[clamp(40px,5vw,64px)] leading-[0.95] tracking-[-0.02em]">{children}</h1>
    </div>
  );
}
