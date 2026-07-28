"use client";

import { useEffect } from "react";
import { getCalApi } from "@calcom/embed-react";

// Evento de prueba — Gesa todavía no tiene su cuenta/evento reales de Cal.com
// configurados. Cuando los tenga, actualizar este slug (única constante a
// tocar, no está repetido en ningún otro lugar).
const CAL_LINK = "pedro-lambarri/clase-de-prueba";

export default function CalBookingButton({ label }: { label: string }) {
  useEffect(() => {
    (async function initCal() {
      const cal = await getCalApi();
      cal("ui", {
        theme: "light",
        styles: {
          branding: {
            brandColor: "#00b7b5",
          },
        },
      });
    })();
  }, []);

  return (
    <button
      type="button"
      data-cal-link={CAL_LINK}
      className="inline-block rounded-sm bg-[#00b7b5] px-[2.3rem] py-4 text-base font-medium text-[#04282d] shadow-[0_4px_20px_rgba(0,183,181,0.3)] transition-[transform,box-shadow,background] duration-[250ms] ease-out hover:-translate-y-0.5 hover:bg-[#33cfcd] hover:shadow-[0_8px_26px_rgba(0,183,181,0.4)] motion-reduce:transition-none"
    >
      {label}
    </button>
  );
}
