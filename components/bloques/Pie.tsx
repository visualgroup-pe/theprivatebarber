import { Logo } from "@/components/marca/Logo";
import { EnlaceNav } from "@/components/ui/Enlace";
import {
  correoVisible,
  enlaceCorreo,
  enlaceInstagram,
  enlaceWhatsApp,
  instagramVisible,
  whatsappVisible,
} from "@/lib/contacto";

type Props = { enPortada?: boolean };

export function Pie({ enPortada = true }: Props) {
  const a = (ancla: string) => (enPortada ? `#${ancla}` : `/#${ancla}`);
  const columna = "flex flex-col gap-3";
  const titulo = "etiqueta mt-0 mb-2 text-garua";
  return (
    <footer
      id="legal"
      className="border-t border-lino/10 bg-obsidiana pt-[clamp(90px,10vw,150px)] pb-10 text-lino"
    >
      <div className="contenedor">
        <div className="text-center">
          <Logo
            variante="principal"
            fondo="oscuro"
            alto={130}
            className="revelar mx-auto block"
            style={{ width: "clamp(200px, 22vw, 300px)", height: "auto" }}
          />
          <p className="font-serif revelar mt-8 mb-0 text-[26px]">
            <em className="text-huaca-claro">Precisión en privado.</em>
          </p>
        </div>
        <div className="mt-[clamp(72px,8vw,120px)] grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-10 border-t border-lino/[0.12] pt-10 text-[15px]">
          <nav aria-label="Servicio" className={columna}>
            <p className={titulo}>Servicio</p>
            <EnlaceNav href={a("servicios")} className="self-start">
              La carta
            </EnlaceNav>
            <EnlaceNav href={a("visita")} className="self-start">
              La visita
            </EnlaceNav>
            <EnlaceNav href={a("barberos")} className="self-start">
              Barberos
            </EnlaceNav>
            <EnlaceNav href="/resenas" className="self-start">
              Reseñas
            </EnlaceNav>
          </nav>
          <div className={columna}>
            <p className={titulo}>Contacto</p>
            <EnlaceNav href={enlaceWhatsApp(undefined, a("reserva"))} className="self-start">
              WhatsApp {whatsappVisible}
            </EnlaceNav>
            <EnlaceNav href={enlaceInstagram} className="self-start">
              Instagram {instagramVisible}
            </EnlaceNav>
            <EnlaceNav href={enlaceCorreo} className="self-start">
              {correoVisible}
            </EnlaceNav>
          </div>
          <div className={columna}>
            <p className={titulo}>Horario</p>
            <span>Lunes a sábado</span>
            <span className="font-mono text-[14px]">09:00–21:00</span>
          </div>
          <nav aria-label="Legal" className={columna}>
            <p className={titulo}>Legal</p>
            <EnlaceNav href="/privacidad" className="self-start">
              Política de privacidad
            </EnlaceNav>
            <EnlaceNav href="/terminos" className="self-start">
              Términos y condiciones
            </EnlaceNav>
            <EnlaceNav href="/libro-de-reclamaciones" className="inline-flex items-center gap-2.5 self-start">
              <svg width="15" height="17" viewBox="0 0 16 18" fill="none" aria-hidden="true">
                <path d="M2 1h9l3 3v13H2z" stroke="currentColor" strokeWidth="1.2" />
                <path d="M5 7h6M5 10h6M5 13h4" stroke="currentColor" strokeWidth="1.2" />
              </svg>
              Libro de Reclamaciones
            </EnlaceNav>
          </nav>
        </div>
        <div className="mt-[72px] flex flex-wrap justify-between gap-3 text-[12px] text-garua">
          <span>© 2026 The Private Barber · [Razón social] · RUC [pendiente]</span>
          <span>Lima, Perú</span>
        </div>
      </div>
    </footer>
  );
}
