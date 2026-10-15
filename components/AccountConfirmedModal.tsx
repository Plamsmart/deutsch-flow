"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import BoatModal from "./BoatModal";

export default function AccountConfirmedModal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const isConfirmed = searchParams.get("confirmed") === "1";

  // Mismo criterio que PaymentSuccessModal: cierra el modal quitando solo
  // el query param "confirmed" (preserva hash y el resto de params).
  const closeModal = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("confirmed");
    const query = params.toString();
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const nextUrl = `${pathname}${query ? `?${query}` : ""}${hash}`;
    router.replace(nextUrl, { scroll: false });
  }, [pathname, router, searchParams]);

  return (
    <BoatModal
      open={isConfirmed}
      onClose={closeModal}
      namespace="accountConfirmed"
      ctaHref="/mi-cuenta"
    />
  );
}
