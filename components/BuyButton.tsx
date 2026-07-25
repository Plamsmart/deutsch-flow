"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, SubmitEvent } from "react";
import { createPortal } from "react-dom";
import { Fraunces, Work_Sans } from "next/font/google";
import { useTranslations } from "next-intl";
import type { PlanId } from "@/lib/plans";
import styles from "./BuyButton.module.css";

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

type EnrollmentFormData = {
  name: string;
  email: string;
  level: string;
  notes: string;
};

type Status = "idle" | "submitting" | "error";

const LEVEL_KEYS = ["beginner", "a1", "a2", "b1", "b2", "c1"] as const;

export default function BuyButton({
  planId,
  planTitle,
  priceLabel,
}: {
  planId: PlanId;
  planTitle: string;
  priceLabel: string;
}) {
  // "buyButton" y "modal" son namespaces de nivel raíz en messages/*.json
  // (hermanos de "clases"), no sub-claves de "clases".
  const t = useTranslations();
  const tModal = useTranslations("modal");

  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [formData, setFormData] = useState<EnrollmentFormData>({
    name: "",
    email: "",
    level: "",
    notes: "",
  });
  const panelRef = useRef<HTMLDivElement>(null);

  function openModal() {
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
    setStatus("idle");
  }

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        closeModal();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeModal();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function handleChange(
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, ...formData }),
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error("Checkout request failed");
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("Error iniciando el checkout:", error);
      setStatus("error");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="mt-4 w-full rounded-[10px] bg-[#005461] py-3 text-[0.85rem] font-semibold text-[#f4f4f4] transition-colors duration-200 hover:bg-[#00b7b5] hover:text-[#005461]"
      >
        {t("buyButton")}
      </button>

      {/*
        Renderizado condicional a propósito: hay 7 instancias de BuyButton en
        la página (una por plan). Si el overlay/panel quedaran siempre
        montados (solo ocultos con opacity), tendríamos 7 paneles en
        position:fixed apilados en el centro de la pantalla, cada uno con
        pointer-events:auto, interceptando clics de los botones "Comprar"
        reales. Con {isOpen && (...)} nunca hay más de un overlay/panel en el
        DOM al mismo tiempo (solo el que el usuario abrió).

        Se porta a document.body con createPortal: si el modal quedara anidado
        dentro de la tarjeta de Clases.tsx, el "hover:-translate-y-1" de esa
        tarjeta (activo mientras el cursor está sobre ella, como pasa al
        hacer click en "Comprar") convertiría a la tarjeta en el containing
        block de sus descendientes position:fixed, atrapando el modal dentro
        de los límites de la tarjeta en vez de centrarlo en toda la pantalla.
        `isOpen` solo es true por una interacción del usuario en el navegador
        (nunca durante el render del servidor, donde arranca en false), así
        que `document` ya existe en ese momento; el chequeo de
        `typeof document !== "undefined"` es una salvaguarda extra para
        evitar cualquier problema de hidratación.
      */}
      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className={styles.overlay}>
            <div
              ref={panelRef}
              className={`${fraunces.variable} ${workSans.variable} ${styles.panel} w-full max-w-[440px] rounded-[20px] bg-white p-[1.8rem] font-[family-name:var(--font-work-sans)]`}
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <span className="mb-1 block text-[0.72rem] font-semibold tracking-[0.16em] text-[#00b7b5] uppercase">
                    {tModal("eyebrow")}
                  </span>
                  <h3 className="font-[family-name:var(--font-fraunces)] text-[1.4rem] font-medium text-[#005461]">
                    {tModal("heading")}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  aria-label={tModal("closeLabel")}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#005461] transition-colors duration-200 hover:bg-[rgba(0,84,97,0.08)]"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="h-4 w-4"
                  >
                    <path d="M18 6 6 18" />
                    <path d="M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-5 flex items-center justify-between rounded-[12px] bg-[#f4f4f4] px-4 py-3">
                <span className="text-[0.9rem] font-medium text-[#005461]">
                  {planTitle}
                </span>
                <span className="font-[family-name:var(--font-fraunces)] text-[1.2rem] font-medium text-[#005461]">
                  {priceLabel}
                </span>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label
                    htmlFor={`${planId}-name`}
                    className="mb-1 block text-[0.78rem] text-[#005461] opacity-80"
                  >
                    {tModal("nameLabel")}
                  </label>
                  <input
                    type="text"
                    id={`${planId}-name`}
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={tModal("namePlaceholder")}
                    required
                    className="w-full rounded-[10px] border border-[rgba(0,84,97,0.18)] px-3 py-2 text-[0.9rem] text-[#142023] outline-none transition-colors duration-200 focus:border-[#00b7b5]"
                  />
                </div>

                <div className="mb-3">
                  <label
                    htmlFor={`${planId}-email`}
                    className="mb-1 block text-[0.78rem] text-[#005461] opacity-80"
                  >
                    {tModal("emailLabel")}
                  </label>
                  <input
                    type="email"
                    id={`${planId}-email`}
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={tModal("emailPlaceholder")}
                    required
                    className="w-full rounded-[10px] border border-[rgba(0,84,97,0.18)] px-3 py-2 text-[0.9rem] text-[#142023] outline-none transition-colors duration-200 focus:border-[#00b7b5]"
                  />
                </div>

                <div className="mb-3">
                  <label
                    htmlFor={`${planId}-level`}
                    className="mb-1 block text-[0.78rem] text-[#005461] opacity-80"
                  >
                    {tModal("levelLabel")}
                  </label>
                  <select
                    id={`${planId}-level`}
                    name="level"
                    value={formData.level}
                    onChange={handleChange}
                    required
                    className="w-full rounded-[10px] border border-[rgba(0,84,97,0.18)] px-3 py-2 text-[0.9rem] text-[#142023] outline-none transition-colors duration-200 focus:border-[#00b7b5]"
                  >
                    <option value="" disabled>
                      {tModal("levelPlaceholder")}
                    </option>
                    {LEVEL_KEYS.map((levelKey) => (
                      <option key={levelKey} value={levelKey}>
                        {tModal(`levels.${levelKey}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label
                    htmlFor={`${planId}-notes`}
                    className="mb-1 block text-[0.78rem] text-[#005461] opacity-80"
                  >
                    {tModal("notesLabel")}
                  </label>
                  <textarea
                    id={`${planId}-notes`}
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder={tModal("notesPlaceholder")}
                    className="min-h-[80px] w-full resize-y rounded-[10px] border border-[rgba(0,84,97,0.18)] px-3 py-2 text-[0.9rem] text-[#142023] outline-none transition-colors duration-200 focus:border-[#00b7b5]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="w-full rounded-[10px] bg-[#00b7b5] py-3 text-[0.95rem] font-semibold text-[#005461] transition-colors duration-200 hover:bg-[#33cfcd] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {status === "submitting"
                    ? tModal("submittingText")
                    : tModal("continueButton")}
                </button>

                {status === "error" && (
                  <p className="mt-3 text-center text-[0.8rem] text-red-500">
                    {tModal("errorText")}
                  </p>
                )}

                <p className="mt-3 text-center text-[0.72rem] text-[#005461] opacity-60">
                  {tModal("secureNote")}
                </p>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
