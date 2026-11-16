"use client";

import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { Boton } from "@/components/ui/Boton";
import { Campo, CampoSeleccion, CampoTexto } from "@/components/ui/Campo";
import { Opcion } from "@/components/ui/Opcion";
import {
  erroresPorCampo,
  esquemaReclamacion,
  reclamacionDesdeFormData,
  TIPOS_DOCUMENTO,
  type ErroresReclamacion,
} from "@/lib/esquemas/reclamacion";
import { registrarReclamacion, type EstadoReclamacion } from "./acciones";

const leyenda = "font-serif mb-6 p-0 text-[clamp(26px,2.2vw,34px)] leading-[1.1] text-obsidiana";

export function FormularioReclamacion() {
  const [estado, accion, enviando] = useActionState<EstadoReclamacion, FormData>(registrarReclamacion, {
    estado: "inicial",
  });
  const [erroresCliente, setErroresCliente] = useState<ErroresReclamacion | null>(null);
  const formulario = useRef<HTMLFormElement>(null);

  const valores = estado.estado === "errores" || estado.estado === "no-disponible" ? estado.valores : {};
  const errores: ErroresReclamacion = erroresCliente ?? (estado.estado === "errores" ? estado.errores : {});
  const [menor, setMenor] = useState(false);

  const enfocarPrimerError = (errs: ErroresReclamacion) => {
    const primero = Object.keys(errs)[0];
    if (primero) formulario.current?.querySelector<HTMLElement>(`[name="${primero}"]`)?.focus();
  };

  // Tras la validación del servidor: foco en el primer campo con error.
  useEffect(() => {
    if (estado.estado === "errores") enfocarPrimerError(estado.errores);
  }, [estado]);

  function validarAntesDeEnviar(e: FormEvent<HTMLFormElement>) {
    const resultado = esquemaReclamacion.safeParse(reclamacionDesdeFormData(new FormData(e.currentTarget)));
    if (!resultado.success) {
      e.preventDefault();
      const errs = erroresPorCampo(resultado.error);
      setErroresCliente(errs);
      enfocarPrimerError(errs);
    } else {
      setErroresCliente(null);
    }
  }

  if (estado.estado === "registrada") {
    return (
      <div role="status" className="bg-piedra p-[clamp(28px,4vw,56px)]">
        <p className="etiqueta m-0 text-huaca-profundo">Hoja registrada</p>
        <p className="font-serif mt-4 mb-0 text-[clamp(38px,3.8vw,60px)] leading-none">
          N.° <span className="font-mono text-[0.6em]">{estado.correlativo}</span>
        </p>
        <p className="mt-5 mb-0 max-w-[520px] text-[17px] leading-[1.6] text-tabaco">
          {estado.copiaPorCorreo
            ? `Te enviamos una copia a ${estado.correo}. `
            : "Guarda este número: identifica tu hoja. "}
          Te responderemos en un plazo no mayor a quince (15) días hábiles.
        </p>
      </div>
    );
  }

  // `key` vuelve a montar los campos con los valores devueltos por el servidor.
  const claveValores = JSON.stringify(valores);

  return (
    <form
      ref={formulario}
      action={accion}
      onSubmit={validarAntesDeEnviar}
      noValidate
      aria-label="Hoja de reclamación"
      className="flex flex-col gap-16"
      key={claveValores}
    >
      <fieldset className="m-0 border-0 p-0">
        <legend className={leyenda}>
          <span className="font-mono mr-3 text-[14px] align-middle text-huaca-profundo">01</span>
          Identificación del consumidor reclamante
        </legend>
        <div className="grid grid-cols-1 gap-x-7 gap-y-8 md:grid-cols-2">
          <Campo
            tono="claro"
            etiqueta="Nombre completo"
            name="nombre"
            autoComplete="name"
            defaultValue={valores.nombre}
            error={errores.nombre}
            className="md:col-span-2"
          />
          <CampoSeleccion
            tono="claro"
            etiqueta="Tipo de documento"
            name="tipoDocumento"
            defaultValue={valores.tipoDocumento ?? "DNI"}
            error={errores.tipoDocumento}
          >
            {TIPOS_DOCUMENTO.map((t) => (
              <option key={t} value={t}>
                {t === "CE" ? "Carné de extranjería" : t}
              </option>
            ))}
          </CampoSeleccion>
          <Campo
            tono="claro"
            etiqueta="Número de documento"
            name="numeroDocumento"
            inputMode="text"
            defaultValue={valores.numeroDocumento}
            error={errores.numeroDocumento}
          />
          <Campo
            tono="claro"
            etiqueta="Domicilio"
            name="domicilio"
            autoComplete="street-address"
            defaultValue={valores.domicilio}
            error={errores.domicilio}
            className="md:col-span-2"
          />
          <Campo
            tono="claro"
            etiqueta="Teléfono"
            name="telefono"
            type="tel"
            autoComplete="tel"
            placeholder="9XX XXX XXX"
            defaultValue={valores.telefono}
            error={errores.telefono}
          />
          <Campo
            tono="claro"
            etiqueta="Correo electrónico"
            name="correo"
            type="email"
            autoComplete="email"
            defaultValue={valores.correo}
            error={errores.correo}
            ayuda="Ahí te enviamos la copia de tu hoja."
          />
          <label className="flex min-h-11 items-start gap-3 text-[15px] leading-[1.45] text-tabaco md:col-span-2">
            <input
              type="checkbox"
              name="menorDeEdad"
              value="si"
              defaultChecked={valores.menorDeEdad === "si"}
              onChange={(e) => setMenor(e.currentTarget.checked)}
              className="mt-0.5 size-[18px] shrink-0 accent-obsidiana"
            />
            Soy menor de edad
          </label>
          {(menor || valores.menorDeEdad === "si") && (
            <Campo
              tono="claro"
              etiqueta="Nombre del padre, madre o apoderado"
              name="apoderado"
              defaultValue={valores.apoderado}
              error={errores.apoderado}
              className="md:col-span-2"
            />
          )}
        </div>
      </fieldset>

      <fieldset className="m-0 border-0 p-0">
        <legend className={leyenda}>
          <span className="font-mono mr-3 text-[14px] align-middle text-huaca-profundo">02</span>
          Identificación del bien contratado
        </legend>
        <div className="grid grid-cols-1 gap-x-7 gap-y-8 md:grid-cols-2">
          <fieldset className="m-0 border-0 p-0 md:col-span-2">
            <legend className="etiqueta-sm mb-2.5 p-0 text-tabaco">Tipo</legend>
            <div className="grid grid-cols-2 gap-2.5">
              {(["servicio", "producto"] as const).map((t) => (
                <Opcion key={t} name="tipoBien" value={t} defaultChecked={(valores.tipoBien ?? "servicio") === t}>
                  <span className="text-[15px] font-medium capitalize">{t}</span>
                </Opcion>
              ))}
            </div>
            {errores.tipoBien && (
              <p className="campo__error mt-2 text-huaca-profundo" role="alert">
                {errores.tipoBien}
              </p>
            )}
          </fieldset>
          <Campo
            tono="claro"
            etiqueta="Descripción"
            name="descripcionBien"
            placeholder="Por ejemplo: corte y barba del 10 de diciembre"
            defaultValue={valores.descripcionBien}
            error={errores.descripcionBien}
          />
          <Campo
            tono="claro"
            etiqueta="Monto reclamado (S/), opcional"
            name="montoReclamado"
            inputMode="decimal"
            defaultValue={valores.montoReclamado}
            error={errores.montoReclamado}
          />
        </div>
      </fieldset>

      <fieldset className="m-0 border-0 p-0">
        <legend className={leyenda}>
          <span className="font-mono mr-3 text-[14px] align-middle text-huaca-profundo">03</span>
          Detalle de la reclamación y pedido
        </legend>
        <fieldset className="m-0 border-0 p-0">
          <legend className="etiqueta-sm mb-2.5 p-0 text-tabaco">Tipo</legend>
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
            <Opcion name="tipo" value="reclamo" defaultChecked={valores.tipo === "reclamo"}>
              <span className="flex flex-col gap-1">
                <span className="font-serif text-[24px] leading-none">Reclamo</span>
                <span className="text-[13px] leading-[1.4] text-tabaco">
                  Disconformidad relacionada con los productos o servicios.
                </span>
              </span>
            </Opcion>
            <Opcion name="tipo" value="queja" defaultChecked={valores.tipo === "queja"}>
              <span className="flex flex-col gap-1">
                <span className="font-serif text-[24px] leading-none">Queja</span>
                <span className="text-[13px] leading-[1.4] text-tabaco">
                  Disconformidad no relacionada con los productos o servicios, o malestar con la atención al público.
                </span>
              </span>
            </Opcion>
          </div>
          {errores.tipo && (
            <p className="campo__error mt-2 text-huaca-profundo" role="alert">
              {errores.tipo}
            </p>
          )}
        </fieldset>
        <div className="mt-8 grid gap-8">
          <CampoTexto
            tono="claro"
            etiqueta="Detalle"
            name="detalle"
            defaultValue={valores.detalle}
            error={errores.detalle}
          />
          <CampoTexto
            tono="claro"
            etiqueta="Pedido"
            name="pedido"
            rows={3}
            defaultValue={valores.pedido}
            error={errores.pedido}
          />
        </div>
      </fieldset>

      <div className="flex flex-col items-start gap-5 border-t border-obsidiana pt-8">
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
          {enviando ? "Enviando…" : "Enviar hoja de reclamación"}
        </Boton>
        <p className="m-0 max-w-[560px] text-[13px] leading-[1.5] text-tabaco">
          Al enviar recibirás una copia de esta hoja en tu correo. Tus datos se tratan solo para atender tu reclamo,
          conforme a nuestra{" "}
          <a href="/privacidad" className="text-obsidiana underline">
            política de privacidad
          </a>
          .
        </p>
      </div>
    </form>
  );
}
