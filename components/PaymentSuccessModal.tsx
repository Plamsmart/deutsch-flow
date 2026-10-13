"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import BoatModal from "./BoatModal";

export default function PaymentSuccessModal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const isSuccess = searchParams.get("checkout") === "success";

  // Cierra el modal quitando el query param "checkout" de la URL (sin tocar
  // ningún otro param, y preservando el hash #clases si estaba presente), así
  // que si la persona recarga la página el modal no vuelve a aparecer.
  const closeModal = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("checkout");
    const query = params.toString();
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const nextUrl = `${pathname}${query ? `?${query}` : ""}${hash}`;
    router.replace(nextUrl, { scroll: false });
  }, [pathname, router, searchParams]);

  return (
    <BoatModal
      open={isSuccess}
      onClose={closeModal}
      namespace="paymentSuccess"
    />
  );
}
