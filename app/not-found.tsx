import Link from "next/link";
import { Logo } from "@/components/marca/Logo";
import { Boton } from "@/components/ui/Boton";

export default function NoEncontrada() {
  return (
    <main className="flex min-h-dvh items-center bg-lino px-5 py-16 text-obsidiana">
      <div className="mx-auto w-full max-w-[560px]">
        <Link href="/" aria-label="The Private Barber, inicio" className="inline-block leading-none">
          <Logo alto={22} />
        </Link>
        <p className="etiqueta-sm mt-14 mb-0 text-huaca-profundo">Error 404</p>
        <h1 className="font-serif mt-3 mb-0 text-[clamp(52px,8vw,96px)] leading-[0.9] tracking-[-0.03em]">
          Esta página
          <br />
          <em className="text-huaca">no existe.</em>
        </h1>
        <p className="mt-6 mb-10 max-w-[420px] text-[17px] leading-[1.6] text-tabaco">
          Puede que el enlace esté mal escrito o que la página se haya movido.
        </p>
        <Boton href="/">Volver al inicio</Boton>
      </div>
    </main>
  );
}
