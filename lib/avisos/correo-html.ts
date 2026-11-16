import { colores } from "@/lib/tokens";

/**
 * Correo con el diseño de marca: tablas y estilos en línea (lo que leen
 * Gmail, Outlook y Apple Mail). Las fuentes de marca no cargan en la
 * mayoría de clientes: Georgia hace de serif y Arial de texto.
 */
export type Correo = { asunto: string; html: string; texto: string };

type Bloque = {
  /** Texto de vista previa en la bandeja de entrada */
  preencabezado: string;
  etiqueta: string;
  titulo: string;
  tituloAcento?: string;
  parrafos: string[];
  filas?: Array<[string, string]>;
  boton?: { texto: string; url: string };
  nota?: string;
  sitioUrl: string;
};

export function esc(t: string): string {
  return t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

const SERIF = "'Instrument Serif', Georgia, 'Times New Roman', serif";
const SANS = "'Hanken Grotesk', Arial, Helvetica, sans-serif";
const MONO = "'IBM Plex Mono', 'Courier New', monospace";

export function correoDeMarca(asunto: string, b: Bloque): Correo {
  const c = colores;
  const filas = (b.filas ?? [])
    .map(
      ([k, v]) => `<tr>
  <td style="padding:10px 0;border-bottom:1px solid ${c.piedra};font:14px/1.4 ${SANS};color:${c.tabaco};width:38%;vertical-align:top">${esc(k)}</td>
  <td style="padding:10px 0;border-bottom:1px solid ${c.piedra};font:15px/1.4 ${SANS};color:${c.obsidiana};vertical-align:top">${esc(v)}</td>
</tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<title>${esc(asunto)}</title>
</head>
<body style="margin:0;padding:0;background:${c.lino}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(b.preencabezado)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${c.lino}">
<tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td style="padding:0 0 36px">
  <a href="${esc(b.sitioUrl)}" style="text-decoration:none"><img src="${esc(b.sitioUrl)}/marca/logo-correo.png" width="228" height="22" alt="The Private Barber" style="display:block;border:0;width:228px;height:22px"></a>
</td></tr>
<tr><td style="border-top:1px solid ${c.obsidiana};padding:28px 0 0">
  <p style="margin:0 0 14px;font:500 11px/1.4 ${SANS};letter-spacing:.18em;text-transform:uppercase;color:${c.huacaProfundo}">${esc(b.etiqueta)}</p>
  <h1 style="margin:0;font:400 40px/1.02 ${SERIF};letter-spacing:-.02em;color:${c.obsidiana}">${esc(b.titulo)}${
    b.tituloAcento ? `<br><em style="color:${c.huaca}">${esc(b.tituloAcento)}</em>` : ""
  }</h1>
  ${b.parrafos.map((p) => `<p style="margin:20px 0 0;font:16px/1.6 ${SANS};color:${c.tabaco}">${esc(p)}</p>`).join("")}
  ${filas ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;border-top:1px solid ${c.obsidiana}">${filas}</table>` : ""}
  ${
    b.boton
      ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:32px 0 0"><tr><td style="background:${c.obsidiana}">
  <a href="${esc(b.boton.url)}" style="display:inline-block;padding:18px 28px;font:500 13px/1 ${SANS};letter-spacing:.16em;text-transform:uppercase;color:${c.lino};text-decoration:none">${esc(b.boton.texto)} &rarr;</a>
</td></tr></table>`
      : ""
  }
  ${b.nota ? `<p style="margin:28px 0 0;font:13px/1.55 ${SANS};color:${c.tabaco}">${esc(b.nota)}</p>` : ""}
</td></tr>
<tr><td style="padding:44px 0 0">
  <p style="margin:0;font:italic 400 18px/1.3 ${SERIF};color:${c.huaca}">Precisión en privado.</p>
  <p style="margin:8px 0 0;font:12px/1.5 ${SANS};color:${c.tabaco}">The Private Barber · Barbería privada a domicilio · Lima, Perú</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const texto = [
    b.etiqueta.toUpperCase(),
    "",
    `${b.titulo}${b.tituloAcento ? ` ${b.tituloAcento}` : ""}`,
    "",
    ...b.parrafos.flatMap((p) => [p, ""]),
    ...(b.filas ?? []).map(([k, v]) => `${k}: ${v}`),
    ...(b.boton ? ["", `${b.boton.texto}: ${b.boton.url}`] : []),
    ...(b.nota ? ["", b.nota] : []),
    "",
    "The Private Barber · Precisión en privado · Lima, Perú",
  ].join("\n");

  return { asunto, html, texto };
}

export const fuenteMono = MONO;
