import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/marca/Logo";
import { FormularioIngreso } from "./FormularioIngreso";

export const metadata: Metadata = {
  title: "Ingresar al panel",
  robots: { index: false, follow: false },
};

const AVISOS: Record<string, string> = {
  "sin-acceso": "Tu cuenta no tiene acceso al panel. Pide a la administración que te dé un rol.",
};

async function Formulario({ searchParams }: { searchParams: PageProps<"/ingresar">["searchParams"] }) {
  const p = await searchParams;
  const siguiente = typeof p.siguiente === "string" ? p.siguiente : undefined;
  const aviso = typeof p.error === "string" ? AVISOS[p.error] : undefined;
  return <FormularioIngreso siguiente={siguiente} aviso={aviso} />;
}

/** Ingreso de barberos y administración (las cuentas las crea la administración). */
export default function PaginaIngreso({ searchParams }: PageProps<"/ingresar">) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-lino px-5 py-16 text-obsidiana">
      <div className="w-full max-w-[400px]">
        <Link href="/" aria-label="The Private Barber, inicio" className="inline-block leading-none">
          <Logo alto={22} eager />
        </Link>
        <p className="etiqueta-sm mt-12 mb-0 text-huaca-profundo">Panel</p>
        <h1 className="font-serif mt-3 mb-10 text-[46px] leading-[0.95] tracking-[-0.02em]">
          Ingresa a tu <em className="text-huaca">agenda.</em>
        </h1>
        <Suspense fallback={<div className="h-[260px]" />}>
          <Formulario searchParams={searchParams} />
        </Suspense>
        <p className="mt-8 mb-0 text-[13px] leading-[1.5] text-tabaco">
          ¿Olvidaste tu contraseña? Pídele a la administración que la cambie.
        </p>
      </div>
    </main>
  );
}
