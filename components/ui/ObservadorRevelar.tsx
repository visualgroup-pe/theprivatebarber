"use client";

import { useEffect } from "react";

const SELECTOR = ".revelar, .cortina";

/**
 * Respaldo de las animaciones de scroll para navegadores sin
 * `animation-timeline: view()` (Safari, Firefox). Marca <html> con .rv-io
 * y añade .visto a cada elemento cuando entra en pantalla.
 * Se monta una vez en el layout del sitio.
 */
export function ObservadorRevelar() {
  useEffect(() => {
    if (CSS.supports("animation-timeline: view()")) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    const raiz = document.documentElement;
    const io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) {
            e.target.classList.add("visto");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );

    const observar = (nodo: ParentNode) => {
      nodo.querySelectorAll(SELECTOR).forEach((el) => {
        if (!el.classList.contains("visto")) io.observe(el);
      });
    };

    raiz.classList.add("rv-io");
    observar(document);

    // Contenido nuevo tras navegar en el cliente.
    const mo = new MutationObserver((cambios) => {
      for (const c of cambios) {
        c.addedNodes.forEach((n) => {
          if (n instanceof Element) {
            if (n.matches(SELECTOR)) io.observe(n);
            observar(n);
          }
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      raiz.classList.remove("rv-io");
    };
  }, []);

  return null;
}
