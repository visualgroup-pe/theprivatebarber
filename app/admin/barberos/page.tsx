import { FormAccion } from "@/components/panel/FormAccion";
import { TituloPanel } from "@/components/panel/MarcoPanel";
import { Campo, CampoSeleccion } from "@/components/ui/Campo";
import { exigirRol } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import { agregarHorario, borrarHorario, crearCuentaBarbero, guardarBarbero } from "../acciones";

export const metadata = { title: "Barberos y horarios" };

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

type Barbero = {
  id?: string;
  nombre?: string;
  foto_url?: string | null;
  anos_oficio?: number | null;
  especialidad?: string | null;
  whatsapp?: string | null;
  orden?: number;
  activo?: boolean;
};

function CamposBarbero({ b }: { b: Barbero }) {
  const k = b.id ?? "nuevo";
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {b.id && <input type="hidden" name="id" value={b.id} />}
      <Campo tono="claro" etiqueta="Nombre" name="nombre" defaultValue={b.nombre} required id={`nombre-${k}`} />
      <Campo tono="claro" etiqueta="Años de oficio" name="anos_oficio" type="number" min={0} defaultValue={b.anos_oficio ?? ""} id={`anos-${k}`} />
      <Campo tono="claro" etiqueta="Especialidad" name="especialidad" defaultValue={b.especialidad ?? ""} id={`esp-${k}`} />
      <Campo
        tono="claro"
        etiqueta="WhatsApp (avisos de solicitudes)"
        name="whatsapp"
        type="tel"
        placeholder="9XX XXX XXX"
        defaultValue={b.whatsapp ?? ""}
        id={`wsp-${k}`}
      />
      <Campo tono="claro" etiqueta="Foto (ruta o URL)" name="foto_url" defaultValue={b.foto_url ?? ""} id={`foto-${k}`} />
      <Campo tono="claro" etiqueta="Orden" name="orden" type="number" min={0} defaultValue={b.orden ?? 10} id={`orden-${k}`} />
      <label className="flex min-h-11 items-center gap-3 text-[14px]">
        <input type="checkbox" name="activo" defaultChecked={b.activo ?? true} className="size-[18px] accent-obsidiana" />
        Recibe solicitudes
      </label>
    </div>
  );
}

/** Fichas, horarios y cuentas de acceso de los barberos. */
export default async function PaginaBarberos() {
  await exigirRol("admin");
  const supabase = await crearClienteServidor();
  const { data: barberos } = await supabase
    .from("barberos")
    .select("*, horarios (id, dia_semana, hora_inicio, hora_fin)")
    .order("orden");

  return (
    <>
      <TituloPanel etiqueta="Equipo">Barberos y horarios</TituloPanel>
      <div className="flex flex-col border-t border-obsidiana">
        {(barberos ?? []).map((b) => (
          <section key={b.id} className="border-b border-piedra py-10" aria-label={b.nombre}>
            <h2 className="font-serif m-0 mb-6 text-[36px] leading-none">{b.nombre}</h2>
            <FormAccion accion={guardarBarbero} boton="Guardar ficha" etiqueta={`Ficha de ${b.nombre}`}>
              <CamposBarbero b={b} />
            </FormAccion>

            <h3 className="etiqueta m-0 mt-10 mb-4 text-tabaco">Horario</h3>
            <ul className="m-0 mb-6 flex list-none flex-col border-t border-piedra p-0">
              {[...b.horarios]
                .sort((x, y) => x.dia_semana - y.dia_semana)
                .map((h) => (
                  <li key={h.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-piedra py-2">
                    <span className="text-[15px]">
                      {DIAS[h.dia_semana - 1]} ·{" "}
                      <span className="font-mono">
                        {h.hora_inicio.slice(0, 5)}–{h.hora_fin.slice(0, 5)}
                      </span>
                    </span>
                    <FormAccion accion={borrarHorario} boton="Quitar" etiqueta={`Quitar ${DIAS[h.dia_semana - 1]}`} className="flex-row">
                      <input type="hidden" name="id" value={h.id} />
                    </FormAccion>
                  </li>
                ))}
              {b.horarios.length === 0 && <li className="py-3 text-[14px] text-tabaco">Sin horario: no aparece en el formulario.</li>}
            </ul>
            <FormAccion accion={agregarHorario} boton="Agregar día" etiqueta={`Agregar horario a ${b.nombre}`}>
              <input type="hidden" name="barbero_id" value={b.id} />
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <CampoSeleccion tono="claro" etiqueta="Día" name="dia_semana" defaultValue="1" id={`dia-${b.id}`}>
                  {DIAS.map((d, i) => (
                    <option key={d} value={i + 1}>
                      {d}
                    </option>
                  ))}
                </CampoSeleccion>
                <Campo tono="claro" etiqueta="Desde" name="hora_inicio" type="time" defaultValue="09:00" step={900} id={`ini-${b.id}`} />
                <Campo tono="claro" etiqueta="Hasta" name="hora_fin" type="time" defaultValue="21:00" step={900} id={`fin-${b.id}`} />
              </div>
            </FormAccion>

            <h3 className="etiqueta m-0 mt-10 mb-4 text-tabaco">Acceso al panel</h3>
            {b.user_id ? (
              <p className="m-0 text-[15px] text-tabaco">Cuenta vinculada. Ingresa en /ingresar con su correo.</p>
            ) : (
              <FormAccion accion={crearCuentaBarbero} boton="Crear cuenta" etiqueta={`Crear cuenta de ${b.nombre}`}>
                <input type="hidden" name="barbero_id" value={b.id} />
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <Campo tono="claro" etiqueta="Correo" name="correo" type="email" required id={`correo-${b.id}`} />
                  <Campo
                    tono="claro"
                    etiqueta="Contraseña temporal"
                    name="clave"
                    type="text"
                    minLength={10}
                    required
                    autoComplete="off"
                    ayuda="Mínimo 10 caracteres. Compártela por un canal privado."
                    id={`clave-${b.id}`}
                  />
                </div>
              </FormAccion>
            )}
          </section>
        ))}
      </div>
      <section className="mt-14" aria-label="Nuevo barbero">
        <h2 className="etiqueta m-0 mb-6 text-tabaco">Agregar barbero</h2>
        <FormAccion accion={guardarBarbero} boton="Agregar barbero" etiqueta="Nuevo barbero">
          <CamposBarbero b={{}} />
        </FormAccion>
      </section>
    </>
  );
}
