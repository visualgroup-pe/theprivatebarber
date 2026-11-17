import { RESUMEN_CANCELACION } from "./politicas";

/** Preguntas frecuentes. Los [marcadores] son datos pendientes del brief. */
export const preguntas: Array<{ pregunta: string; respuesta: string }> = [
  {
    pregunta: "¿Qué necesito tener en casa?",
    respuesta:
      "Un espacio con buena luz, una silla y un enchufe cerca. El barbero lleva sus herramientas, capa, toallas y lo necesario para dejar todo limpio.",
  },
  {
    pregunta: "¿Cómo se confirma mi cita?",
    respuesta:
      "Envías una solicitud y el barbero la revisa. Cuando la acepta, recibes la confirmación por WhatsApp y correo. Si ese horario no está libre, te proponemos otro.",
  },
  {
    pregunta: "¿Con cuánta anticipación reservo?",
    respuesta:
      "Puedes pedirla para hoy mismo, hasta una hora antes. El formulario solo muestra los días y franjas en que todavía podemos llegar.",
  },
  {
    pregunta: "¿Qué medios de pago aceptan?",
    respuesta:
      "Tarjeta de crédito o débito, Yape, Plin, transferencia bancaria y efectivo. Emitimos boleta o factura electrónica.",
  },
  {
    pregunta: "¿Puedo reprogramar o cancelar?",
    respuesta: `${RESUMEN_CANCELACION} Los detalles están en los términos y condiciones.`,
  },
  {
    pregunta: "¿Atienden en oficinas y hoteles?",
    respuesta:
      "Sí, siempre que el espacio lo permita. Al reservar coordinamos el acceso, quién te recibe y cualquier indicación del edificio.",
  },
];
