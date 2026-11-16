import { Hanken_Grotesk, IBM_Plex_Mono, Instrument_Serif } from "next/font/google";

/** Titulares. Solo existe en 400: nunca en negrita. */
export const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-instrument-serif",
});

/** Texto. */
export const hankenGrotesk = Hanken_Grotesk({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-hanken-grotesk",
});

/** Solo precios, horas y números. */
export const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-ibm-plex-mono",
});

export const variablesDeFuente = [
  instrumentSerif.variable,
  hankenGrotesk.variable,
  ibmPlexMono.variable,
].join(" ");
