"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { Fraunces, Work_Sans } from "next/font/google";
import { useTranslations } from "next-intl";
import styles from "./BoatModal.module.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-fraunces",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-work-sans",
});

// Componente presentacional reutilizable (el "modal del barco"), usado por
// PaymentSuccessModal (vuelta de Stripe, ?checkout=success), BuyButton
// (solicitud de transferencia enviada) y AccountConfirmedModal (confirmación
// de email, ?confirmed=1). `open` controla todo: el componente devuelve null
// cuando está en false, así que quien lo use puede dejarlo siempre presente
// en el árbol (sin envolverlo en `{open && ...}`) sin riesgo de overlays
// apilados — nunca hay más de un <BoatModal> con open=true al mismo tiempo
// en la práctica.
//
// ctaHref es un <Link> de next/link PLANO (no el de @/i18n/navigation):
// /mi-cuenta vive fuera de app/(public)/[locale] y no lleva prefijo de
// locale, así que agregarle uno (como haría el Link de next-intl) apuntaría
// a una ruta que no existe — mismo motivo por el que components/Navbar.tsx
// usa next/link para ese mismo destino.
export default function BoatModal({
  open,
  onClose,
  namespace,
  ctaHref,
}: {
  open: boolean;
  onClose: () => void;
  namespace: "paymentSuccess" | "requestSent" | "accountConfirmed";
  ctaHref?: string;
}) {
  const t = useTranslations(namespace);
  const panelRef = useRef<HTMLDivElement>(null);
  const showCta = Boolean(ctaHref) && t.has("cta");

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[rgba(4,40,45,0.6)] p-6">
      <div
        ref={panelRef}
        className={`${fraunces.variable} ${workSans.variable} ${styles.modal} relative w-full max-w-[420px] overflow-hidden rounded-[22px] border border-[rgba(0,183,181,0.25)] px-[2.2rem] pt-[2.6rem] pb-[2.2rem] text-center font-[family-name:var(--font-work-sans)] shadow-[0_30px_70px_rgba(0,0,0,0.5)]`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t("closeLabel")}
          className="absolute top-4 right-4 flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-full border-0 bg-[rgba(244,244,244,0.08)] text-base text-[#f4f4f4] transition-colors duration-200 hover:bg-[rgba(244,244,244,0.18)]"
        >
          ✕
        </button>

        <Image
          src="/images/stamp-sheep.png"
          alt=""
          width={339}
          height={283}
          className="absolute -top-[18px] -right-[14px] w-[58px] rotate-[8deg] opacity-85"
        />

        <div className="relative mx-auto mb-[1.4rem] h-[108px] w-[108px]">
          <div className="absolute inset-0 rounded-full border-2 border-[#00b7b5] opacity-40" />
          <Image
            src="/images/fishing-boat-icon.png"
            alt=""
            width={691}
            height={550}
            className="absolute top-1/2 left-1/2 h-auto w-[76px] -translate-x-1/2 -translate-y-1/2"
          />
          <div className="absolute -right-0.5 -bottom-0.5 flex h-[30px] w-[30px] items-center justify-center rounded-full border-[3px] border-[#06232a] bg-[#00b7b5]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-[14px] w-[14px] text-[#005461]"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
        </div>

        <span className="mb-2 block text-[0.74rem] font-semibold tracking-[0.14em] text-[#00b7b5] uppercase">
          {t("eyebrow")}
        </span>
        <h3 className="mb-[0.8rem] font-[family-name:var(--font-fraunces)] text-[1.5rem] leading-[1.25] font-normal text-[#f4f4f4]">
          {t("heading")}
        </h3>
        <p className="mb-[1.6rem] text-[0.92rem] leading-[1.6] font-light text-[#f4f4f4] opacity-75">
          {t("body")}
        </p>

        {showCta && (
          <Link
            href={ctaHref!}
            onClick={onClose}
            className="inline-block rounded-[10px] bg-[#00b7b5] px-6 py-2.5 text-[0.9rem] font-semibold text-[#005461] transition-colors duration-200 hover:bg-[#33cfcd]"
          >
            {t("cta")}
          </Link>
        )}
      </div>
    </div>,
    document.body,
  );
}
