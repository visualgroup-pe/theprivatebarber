"use client";

import { useActionState } from "react";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { ingresar, type EstadoIngreso } from "./acciones";

export function FormularioIngreso({ siguiente, aviso }: { siguiente?: string; aviso?: string }) {
  const [estado, accion, enviando] = useActionState<EstadoIngreso, FormData>(ingresar, {});
  const error = estado.error ?? aviso;
  return (
    <form action={accion} className="flex flex-col gap-8" aria-label="Ingreso al panel">
      {siguiente && <input type="hidden" name="siguiente" value={siguiente} />}
      <Campo
        tono="claro"
        etiqueta="Correo"
        name="correo"
        type="email"
        autoComplete="username"
        required
        defaultValue={estado.correo}
      />
      <Campo tono="claro" etiqueta="Contraseña" name="clave" type="password" autoComplete="current-password" required />
      {error && (
        <p role="alert" className="m-0 text-[14px] leading-[1.5] text-huaca-profundo">
          {error}
        </p>
      )}
      <Boton type="submit" disabled={enviando} className="w-full">
        {enviando ? "Ingresando…" : "Ingresar"}
      </Boton>
    </form>
  );
}
