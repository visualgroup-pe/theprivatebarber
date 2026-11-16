"use client";

import Link from "next/link";
import { useWatch } from "react-hook-form";
import { Boton } from "@/components/ui/Boton";
import { Campo, CampoSeleccion } from "@/components/ui/Campo";
import { Chip } from "@/components/ui/Chip";
import { franjas, OTRO_DISTRITO } from "@/content/zonas";
import { DIAS_ADELANTE, describirDias, franjasDisponibles, sumarDias } from "@/lib/disponibilidad";
import { OTRO_DISTRITO_ID } from "@/lib/esquemas/solicitud";
import { soles } from "@/lib/tokens";
import { useAhoraLima } from "@/lib/useAhoraLima";
import { useSolicitud, type CatalogoReserva } from "./useSolicitud";

const LUGARES = [
  { id: "casa", nombre: "Casa" },
  { id: "oficina", nombre: "Oficina" },
  { id: "hotel", nombre: "Hotel" },
] as const;

function ErrorGrupo({ mensaje }: { mensaje?: string }) {
  if (!mensaje) return null;
  return (
    <p className="campo__error mt-3" role="alert">
      {mensaje}
    </p>
  );
}

/**
 * Formulario de solicitud del bloque Reserva (escritorio), sobre Obsidiana.
 * Campos del lienzo más barbero, lugar, dirección, correo y los dos
 * consentimientos separados (Ley 29733).
 */
export function FormularioEscritorio({ catalogo }: { catalogo: CatalogoReserva }) {
  const { form, enviar, errorGeneral, servicio, asesoria, barbero, totalPen } = useSolicitud(catalogo);
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;
  const [fecha, zonaId] = useWatch({ control: form.control, name: ["fecha", "zonaId"] });
  const ahora = useAhoraLima();
  const hoy = ahora?.fecha;
  // Hasta hidratarse (sin hora), no se deshabilita ninguna franja.
  const libres = ahora ? franjasDisponibles(barbero, fecha, ahora) : null;
  const principales = catalogo.servicios.filter((s) => !s.esAdicional);

  return (
    <form onSubmit={enviar} noValidate aria-label="Solicitud de cita" className="revelar mt-14 flex flex-col gap-10">
      {/* Trampa para bots */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Sitio web
          <input type="text" tabIndex={-1} autoComplete="off" {...register("sitio")} />
        </label>
      </div>

      <fieldset className="m-0 border-0 p-0">
        <legend className="etiqueta mb-4 p-0 text-garua">Servicio</legend>
        <div className="flex flex-wrap gap-2.5">
          {principales.map((s) => (
            <Chip key={s.id} value={s.id} {...register("servicioId")}>
              {s.nombre}
            </Chip>
          ))}
        </div>
        {asesoria && (
          <div className="mt-3.5 flex flex-wrap gap-2.5">
            <Chip tipo="checkbox" disabled={!servicio} {...register("conAsesoria")}>
              + {asesoria.nombre} · {soles(asesoria.precioPen)}
            </Chip>
          </div>
        )}
        <ErrorGrupo mensaje={errors.servicioId?.message ?? errors.conAsesoria?.message} />
      </fieldset>

      <fieldset className="m-0 border-0 p-0">
        <legend className="etiqueta mb-4 p-0 text-garua">Barbero</legend>
        <div className="flex flex-wrap gap-2.5">
          {catalogo.barberos.map((b) => (
            <Chip key={b.id} value={b.id} {...register("barberoId")}>
              {b.nombre} · {describirDias(b.horarios).corto}
            </Chip>
          ))}
        </div>
        <ErrorGrupo mensaje={errors.barberoId?.message} />
      </fieldset>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-x-7 gap-y-8">
        <CampoSeleccion etiqueta="Distrito" error={errors.zonaId?.message} {...register("zonaId")}>
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
        <Campo
          etiqueta="Fecha"
          type="date"
          min={hoy}
          max={hoy ? sumarDias(hoy, DIAS_ADELANTE) : undefined}
          error={errors.fecha?.message}
          ayuda={barbero ? `${barbero.nombre} ${describirDias(barbero.horarios).nota}.` : undefined}
          {...register("fecha")}
        />
        {zonaId === OTRO_DISTRITO_ID && (
          <Campo
            etiqueta="Tu distrito"
            placeholder="Te confirmamos si podemos llegar"
            error={errors.distritoOtro?.message}
            {...register("distritoOtro")}
          />
        )}
      </div>

      <fieldset className="m-0 border-0 p-0">
        <legend className="etiqueta mb-4 p-0 text-garua">Hora preferida</legend>
        <div className="flex flex-wrap gap-2.5">
          {franjas.map((f) => (
            <Chip
              key={f.id}
              value={f.id}
              disabled={Boolean(libres && barbero && fecha) && !libres?.includes(f.id)}
              {...register("franja")}
            >
              {f.nombre} · {f.inicio}–{f.fin}
            </Chip>
          ))}
        </div>
        <p className="mt-3 mb-0 text-[13px] text-garua">El barbero fija la hora exacta al confirmar.</p>
        <ErrorGrupo mensaje={errors.franja?.message} />
      </fieldset>

      <fieldset className="m-0 border-0 p-0">
        <legend className="etiqueta mb-4 p-0 text-garua">Lugar</legend>
        <div className="flex flex-wrap gap-2.5">
          {LUGARES.map((l) => (
            <Chip key={l.id} value={l.id} {...register("lugar")}>
              {l.nombre}
            </Chip>
          ))}
        </div>
        <ErrorGrupo mensaje={errors.lugar?.message} />
      </fieldset>

      <Campo
        etiqueta="Dirección y referencia"
        placeholder="Calle, número, piso o depto."
        autoComplete="street-address"
        error={errors.direccion?.message}
        {...register("direccion")}
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-x-7 gap-y-8">
        <Campo etiqueta="Nombre" placeholder="Tu nombre" autoComplete="name" error={errors.nombre?.message} {...register("nombre")} />
        <Campo
          etiqueta="WhatsApp"
          type="tel"
          placeholder="9XX XXX XXX"
          autoComplete="tel-national"
          error={errors.whatsapp?.message}
          {...register("whatsapp")}
        />
        <Campo
          etiqueta="Correo (opcional)"
          type="email"
          placeholder="Para recibir la confirmación"
          autoComplete="email"
          error={errors.correo?.message}
          {...register("correo")}
        />
      </div>

      <div className="flex flex-col gap-3 text-[13px] leading-[1.5] text-garua">
        <label className="flex min-h-11 items-start gap-3">
          <input type="checkbox" className="mt-0.5 size-[18px] shrink-0 accent-lino" {...register("consentimientoDatos")} />
          <span>
            Acepto la{" "}
            <Link href="/privacidad" className="text-lino underline">
              política de privacidad
            </Link>{" "}
            y el uso de mis datos para gestionar la cita.
          </span>
        </label>
        {errors.consentimientoDatos && (
          <p className="campo__error -mt-2" role="alert">
            {errors.consentimientoDatos.message}
          </p>
        )}
        <label className="flex min-h-11 items-start gap-3">
          <input type="checkbox" className="mt-0.5 size-[18px] shrink-0 accent-lino" {...register("consentimientoMarketing")} />
          <span>Quiero recibir novedades y promociones (opcional).</span>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-x-7 gap-y-4">
        <Boton type="submit" variante="clara" disabled={isSubmitting} className="min-h-16 pr-[30px] pl-[34px]">
          {isSubmitting ? "Enviando…" : "Enviar solicitud"}
        </Boton>
        <p className="m-0 text-[13px] leading-[1.5] text-garua" aria-live="polite">
          {servicio ? (
            <>
              Total <span className="font-mono text-[18px] text-lino">{soles(totalPen)}</span> · IGV incluido
            </>
          ) : (
            "Precios en soles, IGV incluido."
          )}
        </p>
      </div>
      {errorGeneral && (
        <p role="alert" className="m-0 max-w-[520px] text-[15px] leading-[1.5] text-huaca-claro">
          {errorGeneral}
        </p>
      )}
    </form>
  );
}
