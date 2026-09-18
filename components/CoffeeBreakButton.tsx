"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, SubmitEvent } from "react";
import { createPortal } from "react-dom";
import { Fraunces, Work_Sans } from "next/font/google";
import { useTranslations } from "next-intl";
import styles from "./CoffeeBreakButton.module.css";

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

type SignupFormData = {
  name: string;
  email: string;
  notes: string;
};

type Status = "idle" | "submitting" | "error" | "success";

const emptyFormData: SignupFormData = { name: "", email: "", notes: "" };

export default function CoffeeBreakButton() {
  // "coffeeBreak" y "modal" (para closeLabel, genérico y compartido con
  // BuyButton) son namespaces de nivel raíz en messages/*.json.
  const t = useTranslations("coffeeBreak");
  const tModal = useTranslations("coffeeBreak.modal");
  const tCommonModal = useTranslations("modal");

  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [formData, setFormData] = useState<SignupFormData>(emptyFormData);
  const panelRef = useRef<HTMLDivElement>(null);

  function openModal() {
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
    setStatus("idle");
    setFormData(emptyFormData);
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
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");

    try {
      // La API route guarda con la service_role key y manda los emails de
      // aviso (Gesa) y confirmación (quien se apuntó) — mismo patrón que el
      // formulario de Contacto, en vez de insertar directo desde acá con la
      // anon key.
      const response = await fetch("/api/coffee-break", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          notes: formData.notes,
        }),
      });

      if (!response.ok) {
        throw new Error("Coffee break signup request failed");
      }

      setStatus("success");
      setFormData(emptyFormData);
    } catch (error) {
      console.error("Error registrando el interés en Coffee Break:", error);
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
        {t("ctaButton")}
      </button>

      {/*
        Mismo patrón que BuyButton.tsx: renderizado condicional (nunca más de
        un overlay/panel en el DOM) + createPortal a document.body, para que
        el "hover:-translate-y-1" de la tarjeta no atrape el modal dentro de
        sus límites al convertirla en containing block de sus descendientes
        position:fixed.
      */}
      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className={styles.overlay}>
            <div
              ref={panelRef}
              className={`${fraunces.variable} ${workSans.variable} ${styles.panel} w-full max-w-[420px] rounded-[20px] bg-white p-[1.8rem] font-[family-name:var(--font-work-sans)]`}
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
                  aria-label={tCommonModal("closeLabel")}
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

              <div className="mb-5 flex items-center gap-[0.7rem] rounded-[14px] bg-[#f4f4f4] px-[1.1rem] py-[0.9rem]">
                <svg
                  viewBox="0 0 48 48"
                  fill="none"
                  stroke="#005461"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-[26px] w-[26px] shrink-0"
                >
                  <path d="M8,18 L8,34 Q8,40 14,40 L28,40 Q34,40 34,34 L34,18 Z" />
                  <path d="M34,20 L38,20 Q42,20 42,25 Q42,30 38,30 L34,30" />
                </svg>
                <div>
                  <div className="font-[family-name:var(--font-fraunces)] text-[1rem] font-medium text-[#005461]">
                    {t("title")}
                  </div>
                  <div className="text-[0.76rem] text-[#018790] opacity-80">
                    {tModal("planDetail")}
                  </div>
                </div>
              </div>

              {status === "success" ? (
                <div className="flex flex-col items-center gap-3 py-2 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(0,183,181,0.12)] text-[#00b7b5]">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                  <p className="text-[0.92rem] text-[#005461]">
                    {tModal("successText")}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label
                      htmlFor="coffee-break-name"
                      className="mb-1 block text-[0.78rem] text-[#005461] opacity-80"
                    >
                      {tModal("nameLabel")}
                    </label>
                    <input
                      type="text"
                      id="coffee-break-name"
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
                      htmlFor="coffee-break-email"
                      className="mb-1 block text-[0.78rem] text-[#005461] opacity-80"
                    >
                      {tModal("emailLabel")}
                    </label>
                    <input
                      type="email"
                      id="coffee-break-email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder={tModal("emailPlaceholder")}
                      required
                      className="w-full rounded-[10px] border border-[rgba(0,84,97,0.18)] px-3 py-2 text-[0.9rem] text-[#142023] outline-none transition-colors duration-200 focus:border-[#00b7b5]"
                    />
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="coffee-break-notes"
                      className="mb-1 block text-[0.78rem] text-[#005461] opacity-80"
                    >
                      {tModal("notesLabel")}
                    </label>
                    <textarea
                      id="coffee-break-notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder={tModal("notesPlaceholder")}
                      className="min-h-[70px] w-full resize-y rounded-[10px] border border-[rgba(0,84,97,0.18)] px-3 py-2 text-[0.9rem] text-[#142023] outline-none transition-colors duration-200 focus:border-[#00b7b5]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="w-full rounded-[10px] bg-[#00b7b5] py-3 text-[0.95rem] font-semibold text-[#005461] transition-colors duration-200 hover:bg-[#33cfcd] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {status === "submitting"
                      ? tModal("submittingText")
                      : tModal("submitButton")}
                  </button>

                  {status === "error" && (
                    <p className="mt-3 text-center text-[0.8rem] text-red-500">
                      {tModal("errorText")}
                    </p>
                  )}

                  <p className="mt-3 text-center text-[0.72rem] text-[#005461] opacity-60">
                    {tModal("helperNote")}
                  </p>
                </form>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
