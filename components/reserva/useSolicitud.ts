"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { Barbero } from "@/content/barberos";
import type { Servicio } from "@/content/servicios";
import type { Zona } from "@/lib/catalogo";
import {
  errorDeDisponibilidad,
  esquemaSolicitud,
  type CampoSolicitud,
  type ErroresSolicitud,
  type RespuestaSolicitud,
  type Solicitud,
  type SolicitudEntrada,
} from "@/lib/esquemas/solicitud";

export type CatalogoReserva = { servicios: Servicio[]; zonas: Zona[]; barberos: Barbero[] };

/** Donde la página de confirmación lee el resumen (no viaja en la URL). */
export const CLAVE_RESUMEN = "tpb:solicitud";

const SIN_CONEXION = "No pudimos conectar. Revisa tu conexión e inténtalo de nuevo, o escríbenos por WhatsApp.";

type Opciones = {
  /** Se llama con los campos con error tras un envío fallido (el flujo móvil vuelve a ese paso). */
  alFallar?: (campos: CampoSolicitud[]) => void;
};

export function useSolicitud(catalogo: CatalogoReserva, { alFallar }: Opciones = {}) {
  const router = useRouter();
  const form = useForm<SolicitudEntrada, unknown, Solicitud>({
    resolver: zodResolver(esquemaSolicitud),
    mode: "onTouched",
    defaultValues: {
      servicioId: "",
      conAsesoria: false,
      barberoId: "",
      fecha: "",
      lugar: "casa",
      zonaId: "",
      distritoOtro: "",
      direccion: "",
      nombre: "",
      whatsapp: "",
      correo: "",
      consentimientoDatos: false,
      consentimientoMarketing: false,
      sitio: "",
    },
  });
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [servicioId, conAsesoria, barberoId] = useWatch({
    control: form.control,
    name: ["servicioId", "conAsesoria", "barberoId"],
  });
  const servicio = catalogo.servicios.find((s) => s.id === servicioId && !s.esAdicional);
  const asesoria = catalogo.servicios.find((s) => s.esAdicional);
  const barbero = catalogo.barberos.find((b) => b.id === barberoId);
  const totalPen = (servicio?.precioPen ?? 0) + (servicio && conAsesoria && asesoria ? asesoria.precioPen : 0);

  // La asesoría solo va junto a un servicio principal.
  useEffect(() => {
    if (!servicioId && conAsesoria) form.setValue("conAsesoria", false);
  }, [servicioId, conAsesoria, form]);

  function aplicarErrores(errores: ErroresSolicitud) {
    const campos = Object.keys(errores) as CampoSolicitud[];
    for (const campo of campos) form.setError(campo, { type: "server", message: errores[campo] });
    alFallar?.(campos);
    // Tras volver al paso del error, el campo ya está montado.
    requestAnimationFrame(() => campos[0] && form.setFocus(campos[0]));
  }

  const enviar = form.handleSubmit(
    async (datos) => {
      setErrorGeneral(null);
      const noDisponible = errorDeDisponibilidad(datos, catalogo.barberos);
      if (noDisponible) return aplicarErrores(noDisponible);

      let respuesta: RespuestaSolicitud | null = null;
      try {
        const r = await fetch("/api/solicitudes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(datos),
        });
        respuesta = (await r.json().catch(() => null)) as RespuestaSolicitud | null;
      } catch {
        setErrorGeneral(SIN_CONEXION);
        return;
      }
      if (!respuesta?.ok) {
        if (respuesta?.errores) aplicarErrores(respuesta.errores);
        setErrorGeneral(respuesta?.mensaje ?? SIN_CONEXION);
        return;
      }
      try {
        sessionStorage.setItem(CLAVE_RESUMEN, JSON.stringify(respuesta.resumen));
      } catch {
        // Sin almacenamiento (modo privado estricto): la confirmación muestra un mensaje general.
      }
      router.push("/reserva/confirmacion");
    },
    (errores) => alFallar?.(Object.keys(errores) as CampoSolicitud[]),
  );

  return { form, enviar, errorGeneral, servicio, asesoria, barbero, totalPen };
}
