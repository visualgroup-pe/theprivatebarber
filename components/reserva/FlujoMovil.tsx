"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useWatch } from "react-hook-form";
import { Monograma } from "@/components/marca/Monograma";
import { Campo, CampoSeleccion } from "@/components/ui/Campo";
import { Chip } from "@/components/ui/Chip";
import { Opcion } from "@/components/ui/Opcion";
import { franjas, OTRO_DISTRITO } from "@/content/zonas";
import {
  ABREVIATURAS_DIA,
  DIAS_ADELANTE,
  describirDias,
  diaDisponible,
  fechaCorta,
  franjasDisponibles,
  franjaTexto,
  lunesDe,
  mesesDeSemana,
  primerDiaDisponible,
  sumarDias,
} from "@/lib/disponibilidad";
import { CAMPOS_POR_PASO, errorDeDisponibilidad, OTRO_DISTRITO_ID } from "@/lib/esquemas/solicitud";
import { soles } from "@/lib/tokens";
import { useAhoraLima } from "@/lib/useAhoraLima";
import { useSolicitud, type CatalogoReserva } from "./useSolicitud";

const PASOS = [
  { etiqueta: "Servicio", titulo: ["¿Qué hacemos", "esta vez?"], cta: "Elegir día y hora" },
  { etiqueta: "Barbero, día y hora", titulo: ["¿Cuándo te", "atendemos?"], cta: "Dónde te atendemos" },
  { etiqueta: "Lugar y datos", titulo: ["¿Dónde", "te encontramos?"], cta: "Enviar solicitud" },
] as const;

const LUGARES = [
  { id: "casa", nombre: "Casa" },
  { id: "oficina", nombre: "Oficina" },
  { id: "hotel", nombre: "Hotel" },
] as const;

function ErrorGrupo({ mensaje }: { mensaje?: string }) {
  if (!mensaje) return null;
  return (
    <p className="mt-2 mb-0 text-[13px] leading-[1.4] text-huaca-profundo" role="alert">
      {mensaje}
    </p>
  );
}

/**
 * Solicitud de cita en móvil: las pantallas «Móvil · 1 Servicio»,
 * «2 Barbero, día y hora» y «3 Lugar y datos» del lienzo, en un solo formulario.
 */
export function FlujoMovil({ catalogo }: { catalogo: CatalogoReserva }) {
  const [paso, setPaso] = useState(0);
  // Si el envío falla, se vuelve al paso del primer campo con error.
  const { form, enviar, errorGeneral, servicio, asesoria, barbero, totalPen } = useSolicitud(catalogo, {
    alFallar: (campos) => {
      const destino = CAMPOS_POR_PASO.findIndex((grupo) => grupo.some((c) => campos.includes(c)));
      if (destino >= 0) setPaso((actual) => Math.min(actual, destino));
    },
  });
  const {
    register,
    setValue,
    trigger,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = form;
  const titulo = useRef<HTMLHeadingElement>(null);
  const primeraVez = useRef(true);

  const [conAsesoria, fecha, franja, zonaId] = useWatch({
    control: form.control,
    name: ["conAsesoria", "fecha", "franja", "zonaId"],
  });
  const ahora = useAhoraLima();
  const hoy = ahora?.fecha;
  // Semana elegida con las flechas; si no, la de hoy (se conoce al hidratarse).
  const [semanaElegida, setSemana] = useState<string | null>(null);
  const semana = semanaElegida ?? (hoy ? lunesDe(hoy) : null);
  const libres = ahora ? franjasDisponibles(barbero, fecha, ahora) : [];
  const zona = catalogo.zonas.find((z) => z.id === zonaId);
  const principales = catalogo.servicios.filter((s) => !s.esAdicional);

  // Al cambiar de paso, el foco va al titular (lectores de pantalla) y la vista arriba.
  useEffect(() => {
    if (primeraVez.current) {
      primeraVez.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
    titulo.current?.focus();
  }, [paso]);

  // Al elegir barbero: semana de su primer día libre; se borra un día que ya no atiende.
  function alElegirBarbero(id: string) {
    const elegido = catalogo.barberos.find((b) => b.id === id);
    if (!elegido) return;
    const primero = primerDiaDisponible(elegido);
    if (primero) setSemana(lunesDe(primero));
    const actual = form.getValues("fecha");
    if (actual && !diaDisponible(elegido, actual)) setValue("fecha", "");
  }

  async function siguiente() {
    const campos = CAMPOS_POR_PASO[paso];
    const valido = await trigger(campos, { shouldFocus: true });
    if (!valido) return;
    if (paso === 1) {
      const noDisponible = errorDeDisponibilidad(form.getValues(), catalogo.barberos);
      if (noDisponible) {
        const [campo, mensaje] = Object.entries(noDisponible)[0] as [keyof typeof noDisponible, string];
        setError(campo, { message: mensaje });
        setFocus(campo);
        return;
      }
    }
    setPaso((p) => p + 1);
  }

  const resumen =
    paso === 0
      ? servicio
        ? `${servicio.nombre}${conAsesoria ? " + asesoría" : ""}`
        : "Elige un servicio"
      : [fecha ? fechaCorta(fecha) : "Elige el día", franja ? franjaTexto(franja, false) : null, paso === 1 ? barbero?.nombre : zona?.distrito]
          .filter(Boolean)
          .join(" · ");

  const diasSemana = semana ? Array.from({ length: 7 }, (_, i) => sumarDias(semana, i)) : [];
  const puedeAtras = Boolean(semana && hoy && semana > lunesDe(hoy));
  const puedeAdelante = Boolean(semana && hoy && sumarDias(semana, 7) <= sumarDias(hoy, DIAS_ADELANTE));
  const lineaBarbero = barbero ? `${barbero.nombre} ${describirDias(barbero.horarios).nota}` : "Elige primero un barbero";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (paso < 2) void siguiente();
        else void enviar(e);
      }}
      noValidate
      aria-label="Solicitud de cita"
      className="mx-auto flex min-h-dvh w-full max-w-[520px] flex-col bg-lino text-obsidiana"
    >
      {/* Trampa para bots */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Sitio web
          <input type="text" tabIndex={-1} autoComplete="off" {...register("sitio")} />
        </label>
      </div>

      <header className="px-5 pt-[18px]">
        <div className="flex h-11 items-center justify-between">
          {paso === 0 ? (
            <Link href="/#reserva" aria-label="Volver" className="-ml-2.5 inline-flex size-11 items-center justify-center">
              <svg width="20" height="14" viewBox="0 0 20 14" fill="none" aria-hidden="true">
                <path d="M19 7H2M7 1L1 7l6 6" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setPaso((p) => p - 1)}
              aria-label="Volver al paso anterior"
              className="-ml-2.5 inline-flex size-11 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-obsidiana"
            >
              <svg width="20" height="14" viewBox="0 0 20 14" fill="none" aria-hidden="true">
                <path d="M19 7H2M7 1L1 7l6 6" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </button>
          )}
          <Link href="/" aria-label="The Private Barber, inicio" className="leading-none">
            <Monograma fondo="claro" ancho={31} alt="The Private Barber" />
          </Link>
          <Link href="/" aria-label="Cerrar" className="-mr-2.5 inline-flex size-11 items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </Link>
        </div>
        <div className="mt-3.5 flex items-baseline justify-between">
          <span className="etiqueta-sm text-huaca-profundo">Paso {paso + 1} de 3</span>
          <span className="font-mono text-[11px] text-tabaco">{PASOS[paso].etiqueta}</span>
        </div>
        <div aria-hidden="true" className="mt-2.5 h-0.5 bg-piedra">
          <div className="h-0.5 bg-obsidiana transition-[width] duration-500" style={{ width: `${[33, 66, 100][paso]}%` }} />
        </div>
        <h1
          ref={titulo}
          tabIndex={-1}
          className="font-serif mt-[26px] mb-0 text-[42px] leading-[0.95] tracking-[-0.02em] outline-none"
        >
          {PASOS[paso].titulo[0]}
          <br />
          <em className="text-huaca">{PASOS[paso].titulo[1]}</em>
        </h1>
      </header>

      <main className="flex flex-col px-5 pt-[22px] pb-8">
        {paso === 0 && (
          <div className="flex flex-col gap-2.5">
            <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
              <legend className="etiqueta-sm mb-2.5 p-0 text-tabaco">Servicio · 45 min a 1 h</legend>
              {principales.map((s) => (
                <Opcion key={s.id} value={s.id} {...register("servicioId")}>
                  <span className="flex flex-col gap-[3px]">
                    <span className="font-serif text-[24px] leading-none">{s.nombre}</span>
                    <span className="text-[13px] text-tabaco">{s.descripcionCorta}</span>
                  </span>
                  <span className="font-mono text-[15px] whitespace-nowrap">{soles(s.precioPen)}</span>
                </Opcion>
              ))}
              <ErrorGrupo mensaje={errors.servicioId?.message} />
            </fieldset>
            {asesoria && (
              <Opcion
                tipo="checkbox"
                className="mt-2"
                tarjetaClassName="border-dashed"
                disabled={!servicio}
                aria-describedby="asesoria-nota"
                {...register("conAsesoria")}
              >
                <span className="flex items-start gap-3.5">
                  <span className="casilla" aria-hidden="true">
                    <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                      <path d="M1 4.5L4 7.5L10 1" stroke="currentColor" strokeWidth="1.6" />
                    </svg>
                  </span>
                  <span className="flex flex-col gap-[3px]">
                    <span className="text-[15px] font-semibold">Añadir asesoría de imagen</span>
                    <span id="asesoria-nota" className="text-[13px] leading-[1.4] text-tabaco">
                      {servicio ? asesoria.descripcionCorta : "Elige primero un servicio: la asesoría se suma a tu cita."}
                    </span>
                  </span>
                </span>
                <span className="font-mono text-[15px] whitespace-nowrap">+ {soles(asesoria.precioPen)}</span>
              </Opcion>
            )}
          </div>
        )}

        {paso === 1 && (
          <div className="flex flex-col gap-[22px]">
            <fieldset className="m-0 border-0 p-0">
              <legend className="etiqueta-sm mb-2.5 p-0 text-tabaco">Barbero</legend>
              <div className="grid grid-cols-2 gap-2.5">
                {catalogo.barberos.map((b) => (
                  <Opcion
                    key={b.id}
                    value={b.id}
                    tarjetaClassName="h-full flex-col !items-start gap-2.5 !p-3"
                    {...register("barberoId", { onChange: (e) => alElegirBarbero(e.target.value) })}
                  >
                    {b.fotoUrl ? (
                      <span className="relative block h-[86px] w-full bg-piedra">
                        <Image src={b.fotoUrl} alt="" fill sizes="200px" className="object-cover object-[center_15%]" />
                      </span>
                    ) : (
                      <span className="flex h-[86px] w-full items-center justify-center bg-tabaco">
                        <Monograma fondo="oscuro" ancho={28} />
                      </span>
                    )}
                    <span className="flex flex-col gap-0.5">
                      <span className="font-serif text-[22px] leading-none">{b.nombre}</span>
                      <span className="text-[12px] text-tabaco">{describirDias(b.horarios).corto}</span>
                    </span>
                  </Opcion>
                ))}
              </div>
              <ErrorGrupo mensaje={errors.barberoId?.message} />
            </fieldset>

            <fieldset className="m-0 border-0 p-0">
              <legend className="mb-2.5 flex w-full justify-between gap-3 p-0">
                <span className="etiqueta-sm text-tabaco">{semana ? mesesDeSemana(semana) : "Día"}</span>
                <span className="text-right text-[12px] text-tabaco">{lineaBarbero}</span>
              </legend>
              <div className="flex min-h-16 justify-between">
                {diasSemana.map((d, i) => (
                  <Chip
                    key={d}
                    tono="claro"
                    value={d}
                    disabled={!ahora || !diaDisponible(barbero, d, ahora)}
                    caraClassName="!h-16 !w-11 flex-col !justify-center gap-0.5 !p-0"
                    aria-label={fechaCorta(d)}
                    {...register("fecha")}
                  >
                    <span className="font-mono text-[10px] tracking-[0.08em]" aria-hidden="true">
                      {ABREVIATURAS_DIA[i]}
                    </span>
                    <span className="font-serif text-[22px] leading-none" aria-hidden="true">
                      {Number(d.slice(8))}
                    </span>
                  </Chip>
                ))}
              </div>
              <div className="mt-1 flex justify-between">
                <button
                  type="button"
                  disabled={!puedeAtras}
                  onClick={() => semana && setSemana(sumarDias(semana, -7))}
                  className="min-h-11 cursor-pointer border-0 bg-transparent p-0 text-[12px] text-tabaco underline underline-offset-4 disabled:cursor-default disabled:no-underline disabled:opacity-40"
                >
                  ← Semana anterior
                </button>
                <button
                  type="button"
                  disabled={!puedeAdelante}
                  onClick={() => semana && setSemana(sumarDias(semana, 7))}
                  className="min-h-11 cursor-pointer border-0 bg-transparent p-0 text-[12px] text-tabaco underline underline-offset-4 disabled:cursor-default disabled:no-underline disabled:opacity-40"
                >
                  Semana siguiente →
                </button>
              </div>
              <ErrorGrupo mensaje={errors.fecha?.message} />
            </fieldset>

            <fieldset className="m-0 border-0 p-0">
              <legend className="etiqueta-sm mb-2.5 p-0 text-tabaco">Franja</legend>
              <div className="grid grid-cols-2 gap-2">
                {franjas.map((f) => (
                  <Chip
                    key={f.id}
                    tono="claro"
                    value={f.id}
                    disabled={Boolean(ahora && fecha) && !libres.includes(f.id)}
                    className="block"
                    caraClassName="w-full"
                    {...register("franja")}
                  >
                    {f.nombre} · {f.inicio}–{f.fin}
                  </Chip>
                ))}
              </div>
              <p className="mt-2.5 mb-0 text-[12px] text-tabaco">El barbero fija la hora exacta al confirmar.</p>
              <ErrorGrupo mensaje={errors.franja?.message} />
            </fieldset>
          </div>
        )}

        {paso === 2 && (
          <div className="flex flex-col gap-[18px]">
            <fieldset className="m-0 border-0 p-0">
              <legend className="etiqueta-sm mb-2.5 p-0 text-tabaco">Lugar</legend>
              <div className="grid grid-cols-3 gap-2">
                {LUGARES.map((l) => (
                  <Chip key={l.id} tono="claro" value={l.id} className="block" caraClassName="w-full" {...register("lugar")}>
                    {l.nombre}
                  </Chip>
                ))}
              </div>
              <ErrorGrupo mensaje={errors.lugar?.message} />
            </fieldset>
            <CampoSeleccion tono="claro" etiqueta="Distrito" error={errors.zonaId?.message} {...register("zonaId")}>
              <option value="" disabled>
                Elige tu distrito
              </option>
              {catalogo.zonas.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.distrito}
                </option>
              ))}
              <option value={OTRO_DISTRITO_ID}>{OTRO_DISTRITO}</option>
            </CampoSeleccion>
            {zonaId === OTRO_DISTRITO_ID && (
              <Campo
                tono="claro"
                etiqueta="Tu distrito"
                placeholder="Te confirmamos si podemos llegar"
                error={errors.distritoOtro?.message}
                {...register("distritoOtro")}
              />
            )}
            <Campo
              tono="claro"
              etiqueta="Dirección y referencia"
              placeholder="Calle, número, piso o depto."
              autoComplete="street-address"
              error={errors.direccion?.message}
              {...register("direccion")}
            />
            <div className="grid grid-cols-2 gap-4">
              <Campo
                tono="claro"
                etiqueta="Nombre"
                placeholder="Tu nombre"
                autoComplete="given-name"
                error={errors.nombre?.message}
                {...register("nombre")}
              />
              <Campo
                tono="claro"
                etiqueta="WhatsApp"
                type="tel"
                placeholder="9XX XXX XXX"
                autoComplete="tel-national"
                error={errors.whatsapp?.message}
                {...register("whatsapp")}
              />
            </div>
            <Campo
              tono="claro"
              etiqueta="Correo (opcional)"
              type="email"
              placeholder="Para recibir la confirmación"
              autoComplete="email"
              error={errors.correo?.message}
              {...register("correo")}
            />
            <div className="flex flex-col gap-1">
              <label className="flex min-h-11 items-start gap-3 text-[12.5px] leading-[1.45] text-tabaco">
                <input
                  type="checkbox"
                  className="mt-0.5 size-[18px] shrink-0 accent-obsidiana"
                  {...register("consentimientoDatos")}
                />
                <span>
                  Acepto la{" "}
                  <Link href="/privacidad" className="text-obsidiana underline">
                    política de privacidad
                  </Link>{" "}
                  y el uso de mis datos para gestionar la cita.
                </span>
              </label>
              <ErrorGrupo mensaje={errors.consentimientoDatos?.message} />
              <label className="flex min-h-11 items-start gap-3 text-[12.5px] leading-[1.45] text-tabaco">
                <input
                  type="checkbox"
                  className="mt-0.5 size-[18px] shrink-0 accent-obsidiana"
                  {...register("consentimientoMarketing")}
                />
                <span>Quiero recibir novedades y promociones (opcional).</span>
              </label>
            </div>
          </div>
        )}
      </main>

      <div className="sticky bottom-0 mt-auto bg-obsidiana px-5 pt-4 pb-[26px] text-lino">
        {errorGeneral && (
          <p role="alert" className="mt-0 mb-3 text-[13px] leading-[1.45] text-huaca-claro">
            {errorGeneral}
          </p>
        )}
        <div className="mb-3.5 flex items-baseline justify-between gap-3">
          <span className="text-[13px] text-garua" aria-live="polite">
            {resumen}
          </span>
          <span className="font-mono text-[18px]">{servicio ? soles(totalPen) : "S/ —"}</span>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex min-h-14 w-full cursor-pointer items-center justify-between border-0 bg-huaca-profundo px-[22px] text-[13px] font-medium tracking-[0.16em] text-lino uppercase disabled:opacity-60"
        >
          {isSubmitting ? "Enviando…" : PASOS[paso].cta} <span aria-hidden="true">→</span>
        </button>
      </div>
    </form>
  );
}
