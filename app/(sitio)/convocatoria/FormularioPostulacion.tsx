"use client";

import { useActionState, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Boton } from "@/components/ui/Boton";
import { Campo, CampoSeleccion, CampoTexto } from "@/components/ui/Campo";
import { Chip } from "@/components/ui/Chip";
import { DIAS_SEMANA, MOVILIDAD, TECNICAS } from "@/content/convocatoria";
import { franjas } from "@/content/zonas";
import {
  erroresPorCampo,
  esquemaPostulacion,
  postulacionDesdeFormData,
  TIPOS_DOCUMENTO_POSTULACION,
  type ErroresPostulacion,
} from "@/lib/esquemas/postulacion";
import { postular, type EstadoPostulacion } from "./acciones";
import { SubidaFotos } from "./SubidaFotos";

const leyenda = "font-serif mb-6 p-0 text-[clamp(26px,2.2vw,34px)] leading-[1.1] text-obsidiana";
const subleyenda = "etiqueta-sm mb-3 p-0 text-tabaco";

function Numero({ n }: { n: string }) {
  return <span className="font-mono mr-3 text-[14px] align-middle text-huaca-profundo">{n}</span>;
}

function ErrorCampo({ texto }: { texto?: string }) {
  if (!texto) return null;
  return (
    <p className="campo__error mt-2 text-huaca-profundo" role="alert">
      {texto}
    </p>
  );
}

function Casilla({ name, children, marcada }: { name: string; children: ReactNode; marcada?: boolean }) {
  return (
    <label className="flex min-h-11 items-start gap-3 text-[15px] leading-[1.45] text-obsidiana">
      <input
        type="checkbox"
        name={name}
        value="si"
        defaultChecked={marcada}
        className="mt-0.5 size-[18px] shrink-0 accent-obsidiana"
      />
      <span>{children}</span>
    </label>
  );
}

export function FormularioPostulacion({ zonas }: { zonas: string[] }) {
  const [estado, accion, enviando] = useActionState<EstadoPostulacion, FormData>(postular, { estado: "inicial" });
  const [erroresCliente, setErroresCliente] = useState<ErroresPostulacion | null>(null);
  const formulario = useRef<HTMLFormElement>(null);

  const valores = estado.estado === "errores" || estado.estado === "no-disponible" ? estado.valores : {};
  const errores: ErroresPostulacion = erroresCliente ?? (estado.estado === "errores" ? estado.errores : {});
  const v = (k: string) => (typeof valores[k] === "string" ? (valores[k] as string) : undefined);
  const en = (k: string, x: string) => (Array.isArray(valores[k]) ? (valores[k] as string[]).includes(x) : false);
  const [id, setId] = useState<string | null>(() => v("id") ?? null);

  const enfocarPrimerError = (errs: ErroresPostulacion) => {
    const primero = Object.keys(errs)[0];
    if (!primero) return;
    const el =
      formulario.current?.querySelector<HTMLElement>(`[name="${primero}"]:not([type="hidden"])`) ??
      formulario.current?.querySelector<HTMLElement>(`[data-campo="${primero}"]`);
    el?.focus();
    el?.scrollIntoView({ block: "center" });
  };

  useEffect(() => {
    if (estado.estado === "errores") enfocarPrimerError(estado.errores);
  }, [estado]);

  function validarAntesDeEnviar(e: FormEvent<HTMLFormElement>) {
    const resultado = esquemaPostulacion.safeParse(postulacionDesdeFormData(new FormData(e.currentTarget)));
    if (!resultado.success) {
      e.preventDefault();
      const errs = erroresPorCampo(resultado.error);
      setErroresCliente(errs);
      enfocarPrimerError(errs);
    } else {
      setErroresCliente(null);
    }
  }

  if (estado.estado === "enviada") {
    return (
      <div role="status" className="bg-piedra p-[clamp(28px,4vw,56px)]">
        <p className="etiqueta m-0 text-huaca-profundo">Postulación recibida</p>
        <p className="font-serif mt-4 mb-0 text-[clamp(38px,3.8vw,60px)] leading-none">
          Gracias, <em className="text-huaca">{estado.nombre}.</em>
        </p>
        <p className="mt-5 mb-0 max-w-[520px] text-[17px] leading-[1.6] text-tabaco">
          Revisaremos tu perfil y tus trabajos. Si encaja con lo que buscamos, te escribiremos por WhatsApp para
          conversar.
        </p>
      </div>
    );
  }

  const claveValores = JSON.stringify(valores);

  return (
    <form
      ref={formulario}
      action={accion}
      onSubmit={validarAntesDeEnviar}
      noValidate
      aria-label="Postulación de barbero"
      className="flex flex-col gap-16"
      key={claveValores}
    >
      {id && <input type="hidden" name="id" value={id} />}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Sitio web
          <input type="text" name="sitio" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <fieldset className="m-0 border-0 p-0">
        <legend className={leyenda}>
          <Numero n="01" />
          Tus datos
        </legend>
        <div className="grid grid-cols-1 gap-x-7 gap-y-8 md:grid-cols-2">
          <Campo
            tono="claro"
            etiqueta="Nombre completo"
            name="nombre"
            autoComplete="name"
            defaultValue={v("nombre")}
            error={errores.nombre}
            className="md:col-span-2"
          />
          <CampoSeleccion
            tono="claro"
            etiqueta="Tipo de documento"
            name="tipoDocumento"
            defaultValue={v("tipoDocumento") ?? "DNI"}
            error={errores.tipoDocumento}
          >
            {TIPOS_DOCUMENTO_POSTULACION.map((t) => (
              <option key={t} value={t}>
                {t === "CE" ? "Carné de extranjería" : t}
              </option>
            ))}
          </CampoSeleccion>
          <Campo
            tono="claro"
            etiqueta="Número de documento"
            name="numeroDocumento"
            defaultValue={v("numeroDocumento")}
            error={errores.numeroDocumento}
          />
          <Campo
            tono="claro"
            etiqueta="WhatsApp"
            name="whatsapp"
            type="tel"
            autoComplete="tel"
            placeholder="9XX XXX XXX"
            defaultValue={v("whatsapp")}
            error={errores.whatsapp}
            ayuda="Por aquí te escribimos."
          />
          <Campo
            tono="claro"
            etiqueta="Correo (opcional)"
            name="correo"
            type="email"
            autoComplete="email"
            defaultValue={v("correo")}
            error={errores.correo}
          />
          <Campo
            tono="claro"
            etiqueta="Distrito donde vives"
            name="distritoResidencia"
            defaultValue={v("distritoResidencia")}
            error={errores.distritoResidencia}
          />
        </div>
      </fieldset>

      <fieldset className="m-0 border-0 p-0">
        <legend className={leyenda}>
          <Numero n="02" />
          Tu oficio
        </legend>
        <div className="grid grid-cols-1 gap-x-7 gap-y-8 md:grid-cols-2">
          <Campo
            tono="claro"
            etiqueta="Años de oficio"
            name="anosOficio"
            type="number"
            inputMode="numeric"
            min={0}
            max={60}
            defaultValue={v("anosOficio")}
            error={errores.anosOficio}
          />
          <Campo
            tono="claro"
            etiqueta="Especialidad (opcional)"
            name="especialidad"
            placeholder="Por ejemplo: cortes clásicos, degradados"
            defaultValue={v("especialidad")}
            error={errores.especialidad}
          />
          <fieldset className="m-0 border-0 p-0 md:col-span-2">
            <legend className={subleyenda}>Qué dominas</legend>
            <div className="flex flex-wrap gap-2.5">
              {TECNICAS.map((t) => (
                <Chip
                  key={t.id}
                  tipo="checkbox"
                  tono="claro"
                  name="tecnicas"
                  value={t.id}
                  defaultChecked={en("tecnicas", t.id)}
                >
                  {t.nombre}
                </Chip>
              ))}
            </div>
            <ErrorCampo texto={errores.tecnicas} />
          </fieldset>
          <CampoTexto
            tono="claro"
            etiqueta="Dónde has trabajado"
            name="experiencia"
            rows={4}
            placeholder="Barberías, hoteles, clientela propia… y desde cuándo."
            defaultValue={v("experiencia")}
            error={errores.experiencia}
            className="md:col-span-2"
          />
          <div className="md:col-span-2">
            <Casilla name="experienciaDomicilio" marcada={v("experienciaDomicilio") === "si"}>
              Ya he atendido a domicilio, en oficinas o en hoteles.
            </Casilla>
          </div>
        </div>
      </fieldset>

      <fieldset className="m-0 border-0 p-0">
        <legend className={leyenda}>
          <Numero n="03" />
          Tus trabajos
        </legend>
        <div className="grid grid-cols-1 gap-8">
          <div data-campo="fotos" tabIndex={-1} className="outline-none">
            <SubidaFotos
              id={id}
              alCrearId={setId}
              iniciales={Array.isArray(valores.fotos) ? (valores.fotos as string[]) : []}
              error={errores.fotos}
            />
          </div>
          <Campo
            tono="claro"
            etiqueta="Instagram profesional (opcional)"
            name="instagram"
            placeholder="@tuusuario"
            defaultValue={v("instagram")}
            error={errores.instagram}
          />
        </div>
      </fieldset>

      <fieldset className="m-0 border-0 p-0">
        <legend className={leyenda}>
          <Numero n="04" />
          Disponibilidad
        </legend>
        <div className="grid grid-cols-1 gap-8">
          <fieldset className="m-0 border-0 p-0">
            <legend className={subleyenda}>Días</legend>
            <div className="flex flex-wrap gap-2.5">
              {DIAS_SEMANA.map((d, i) => (
                <Chip
                  key={d}
                  tipo="checkbox"
                  tono="claro"
                  name="dias"
                  value={String(i + 1)}
                  defaultChecked={en("dias", String(i + 1))}
                >
                  {d}
                </Chip>
              ))}
            </div>
            <ErrorCampo texto={errores.dias} />
          </fieldset>
          <fieldset className="m-0 border-0 p-0">
            <legend className={subleyenda}>Franjas</legend>
            <div className="flex flex-wrap gap-2.5">
              {franjas.map((f) => (
                <Chip
                  key={f.id}
                  tipo="checkbox"
                  tono="claro"
                  name="franjas"
                  value={f.id}
                  defaultChecked={en("franjas", f.id)}
                >
                  {f.nombre}{" "}
                  <span className="font-mono ml-1.5 text-[12px] opacity-70">
                    {f.inicio}–{f.fin}
                  </span>
                </Chip>
              ))}
            </div>
            <ErrorCampo texto={errores.franjas} />
          </fieldset>
          <fieldset className="m-0 border-0 p-0">
            <legend className={subleyenda}>Distritos en los que puedes atender</legend>
            <div className="flex flex-wrap gap-2.5">
              {zonas.map((z) => (
                <Chip key={z} tipo="checkbox" tono="claro" name="zonas" value={z} defaultChecked={en("zonas", z)}>
                  {z}
                </Chip>
              ))}
            </div>
            <ErrorCampo texto={errores.zonas} />
          </fieldset>
          <CampoSeleccion
            tono="claro"
            etiqueta="Cómo te movilizas"
            name="movilidad"
            defaultValue={v("movilidad") ?? ""}
            error={errores.movilidad}
            className="md:max-w-[360px]"
          >
            <option value="" disabled>
              Elige una opción
            </option>
            {MOVILIDAD.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </CampoSeleccion>
        </div>
      </fieldset>

      <fieldset className="m-0 border-0 p-0">
        <legend className={leyenda}>
          <Numero n="05" />
          Compromisos
        </legend>
        <div className="flex flex-col gap-2">
          <Casilla name="herramientasPropias" marcada={v("herramientasPropias") === "si"}>
            Tengo mis herramientas y un maletín completo: capa, toallas y lo necesario para proteger el espacio.
          </Casilla>
          <Casilla name="compromisoHigiene" marcada={v("compromisoHigiene") === "si"}>
            Limpio y desinfecto mis herramientas entre un cliente y otro.
          </Casilla>
          <Casilla name="compromisoPuntualidad" marcada={v("compromisoPuntualidad") === "si"}>
            Llego a tiempo y trato cada casa, oficina u hotel con discreción y cuidado.
          </Casilla>
        </div>
        <CampoTexto
          tono="claro"
          etiqueta="¿Algo más que debamos saber? (opcional)"
          name="mensaje"
          rows={3}
          defaultValue={v("mensaje")}
          error={errores.mensaje}
          className="mt-8"
        />
      </fieldset>

      <div className="flex flex-col items-start gap-5 border-t border-obsidiana pt-8">
        <label className="flex min-h-11 items-start gap-3 text-[14px] leading-[1.5] text-tabaco">
          <input
            type="checkbox"
            name="consentimientoDatos"
            value="si"
            defaultChecked={v("consentimientoDatos") === "si"}
            className="mt-0.5 size-[18px] shrink-0 accent-obsidiana"
          />
          <span>
            Acepto la{" "}
            <a href="/privacidad#postulantes" className="text-obsidiana underline">
              política de privacidad
            </a>{" "}
            y el uso de mis datos y fotos para evaluar mi postulación.
          </span>
        </label>
        <ErrorCampo texto={errores.consentimientoDatos} />
        {estado.estado === "no-disponible" && (
          <p role="alert" className="m-0 max-w-[560px] bg-piedra p-4 text-[15px] leading-[1.5] text-obsidiana">
            {estado.mensaje}
          </p>
        )}
        {Object.keys(errores).length > 0 && (
          <p role="alert" className="m-0 text-[15px] text-huaca-profundo">
            Revisa los campos marcados antes de enviar.
          </p>
        )}
        <Boton type="submit" disabled={enviando} aria-disabled={enviando}>
          {enviando ? "Enviando…" : "Enviar postulación"}
        </Boton>
      </div>
    </form>
  );
}
