import { Logo } from "@/components/marca/Logo";

// Etapa 1: marcador. La portada completa llega en la etapa 2.
export default function Portada() {
  return (
    <main className="contenedor flex min-h-dvh flex-col items-center justify-center gap-8 text-center">
      <Logo alto={28} />
      <p className="font-serif text-[clamp(44px,6vw,96px)] leading-[0.9] tracking-[-0.03em]">
        Precisión <em className="text-huaca">en privado.</em>
      </p>
    </main>
  );
}
