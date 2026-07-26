"use client";

import { useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Fraunces, Work_Sans } from "next/font/google";
import { useTranslations } from "next-intl";
import styles from "./PaymentSuccessModal.module.css";

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

const AUTO_CLOSE_MS = 7000;

export default function PaymentSuccessModal() {
  const t = useTranslations("paymentSuccess");
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

  useEffect(() => {
    if (!isSuccess) return;

    const timeoutId = setTimeout(closeModal, AUTO_CLOSE_MS);
    return () => clearTimeout(timeoutId);
  }, [isSuccess, closeModal]);

  if (!isSuccess || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[rgba(4,40,45,0.6)] p-6">
      <div
        className={`${fraunces.variable} ${workSans.variable} ${styles.modal} relative w-full max-w-[420px] overflow-hidden rounded-[22px] border border-[rgba(0,183,181,0.25)] px-[2.2rem] pt-[2.6rem] pb-[2.2rem] text-center font-[family-name:var(--font-work-sans)] shadow-[0_30px_70px_rgba(0,0,0,0.5)]`}
      >
        <button
          type="button"
          onClick={closeModal}
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

        <div className="h-[3px] w-full overflow-hidden rounded-full bg-[rgba(244,244,244,0.12)]">
          <div
            className={`${styles.progressFill} h-full w-full rounded-full bg-[#00b7b5]`}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
