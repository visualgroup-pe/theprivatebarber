"use client";

import { useRef, useState } from "react";
import { FOTOS_MAXIMAS } from "@/content/convocatoria";
import { crearClienteNavegador } from "@/lib/supabase/client";

type Foto = { ruta: string; vista: string };

const LADO_MAXIMO = 1600;

/**
 * Reduce la foto a 1600 px por lado y la pasa a JPEG en el navegador: sube
 * rápido con datos móviles y, de paso, quita los metadatos (ubicación, equipo).
 */
async function reducir(archivo: File): Promise<Blob> {
  const imagen = await createImageBitmap(archivo);
  const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.width, imagen.height));
  const lienzo = document.createElement("canvas");
  lienzo.width = Math.round(imagen.width * escala);
  lienzo.height = Math.round(imagen.height * escala);
  lienzo.getContext("2d")!.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
  imagen.close();
  return new Promise((resolver, rechazar) =>
    lienzo.toBlob((b) => (b ? resolver(b) : rechazar(new Error("sin imagen"))), "image/jpeg", 0.85),
  );
}

/**
 * Fotos de trabajos: cada una se sube directo a Storage con una URL firmada
 * que entrega /api/convocatoria/fotos. El formulario envía solo las rutas.
 */
export function SubidaFotos({
  id,
  alCrearId,
  iniciales,
  error,
}: {
  id: string | null;
  alCrearId: (id: string) => void;
  iniciales: string[];
  error?: string;
}) {
  const [fotos, setFotos] = useState<Foto[]>(() => iniciales.map((ruta) => ({ ruta, vista: "" })));
  const [subiendo, setSubiendo] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);
  const entrada = useRef<HTMLInputElement>(null);
  const idActual = useRef(id);

  async function subir(archivos: FileList | null) {
    if (!archivos?.length) return;
    setAviso(null);
    const libres = FOTOS_MAXIMAS - fotos.length;
    const lista = [...archivos].slice(0, libres);
    if (archivos.length > libres) setAviso(`Puedes subir hasta ${FOTOS_MAXIMAS} fotos.`);
    const supabase = crearClienteNavegador();

    for (const archivo of lista) {
      setSubiendo((n) => n + 1);
      try {
        if (!archivo.type.startsWith("image/")) throw new Error("tipo");
        const imagen = await reducir(archivo).catch(() => {
          throw new Error("formato");
        });
        const r = await fetch("/api/convocatoria/fotos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: idActual.current }),
        });
        const datos = (await r.json()) as {
          id?: string;
          ruta?: string;
          token?: string;
          mensaje?: string;
        };
        if (!r.ok || !datos.ruta || !datos.token || !datos.id) throw new Error(datos.mensaje ?? "firma");
        if (idActual.current !== datos.id) {
          idActual.current = datos.id;
          alCrearId(datos.id);
        }
        const { error: errorSubida } = await supabase.storage
          .from("postulaciones")
          .uploadToSignedUrl(datos.ruta, datos.token, imagen, {
            contentType: "image/jpeg",
          });
        if (errorSubida) throw new Error("subida");
        setFotos((f) => [...f, { ruta: datos.ruta!, vista: URL.createObjectURL(imagen) }]);
      } catch (e) {
        const motivo = e instanceof Error ? e.message : "";
        setAviso(
          motivo === "tipo" || motivo === "formato"
            ? `No pudimos leer «${archivo.name}». Usa fotos JPG, PNG o WebP.`
            : motivo.length > 12
              ? motivo
              : `No pudimos subir «${archivo.name}». Inténtalo de nuevo.`,
        );
      } finally {
        setSubiendo((n) => n - 1);
      }
    }
    if (entrada.current) entrada.current.value = "";
  }

  function quitar(ruta: string) {
    setFotos((f) => {
      const foto = f.find((x) => x.ruta === ruta);
      if (foto?.vista) URL.revokeObjectURL(foto.vista);
      return f.filter((x) => x.ruta !== ruta);
    });
  }

  const lleno = fotos.length >= FOTOS_MAXIMAS;
  return (
    <div className="flex flex-col gap-4">
      {fotos.map((f) => (
        <input key={f.ruta} type="hidden" name="fotos" value={f.ruta} />
      ))}
      <ul className="m-0 grid list-none grid-cols-3 gap-2.5 p-0 sm:grid-cols-6" aria-label="Fotos subidas">
        {fotos.map((f, i) => (
          <li key={f.ruta} className="relative aspect-square overflow-hidden bg-piedra">
            {f.vista ? (
              // eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob:)
              <img src={f.vista} alt={`Foto ${i + 1}`} className="size-full object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center text-[12px] text-tabaco">Foto {i + 1}</span>
            )}
            <button
              type="button"
              onClick={() => quitar(f.ruta)}
              aria-label={`Quitar foto ${i + 1}`}
              className="absolute top-1 right-1 flex size-8 cursor-pointer items-center justify-center border-0 bg-obsidiana/80 text-[16px] text-lino"
            >
              ×
            </button>
          </li>
        ))}
        {Array.from({ length: subiendo }, (_, i) => (
          <li
            key={`s${i}`}
            className="flex aspect-square items-center justify-center bg-piedra text-[12px] text-tabaco"
          >
            Subiendo…
          </li>
        ))}
      </ul>
      <div>
        <label
          className={`boton boton--pequena focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-huaca ${lleno ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
          aria-disabled={lleno}
        >
          <input
            ref={entrada}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={lleno}
            className="sr-only"
            aria-describedby="fotos-ayuda"
            onChange={(e) => subir(e.currentTarget.files)}
          />
          {fotos.length ? "Añadir más fotos" : "Subir fotos de tus trabajos"}
        </label>
      </div>
      <p id="fotos-ayuda" className="m-0 text-[13px] leading-snug text-tabaco">
        Hasta {FOTOS_MAXIMAS} fotos, JPG, PNG o WebP. Que se vea bien el corte; sin rostros de clientes que no lo hayan
        autorizado.
      </p>
      <p aria-live="polite" className="m-0 text-[13px] text-huaca-profundo empty:hidden">
        {aviso}
      </p>
      {error && (
        <p className="campo__error m-0 text-huaca-profundo" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
