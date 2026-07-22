"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent, SubmitEvent } from "react";
import { Fraunces, Work_Sans } from "next/font/google";
import { useTranslations } from "next-intl";
import styles from "./Contacto.module.css";

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

type ContactFormData = {
  name: string;
  email: string;
  message: string;
};

type Status = "idle" | "sending" | "success" | "error";

const CONTACT_EMAIL = "gesa.nom.gn@gmail.com";
const CONTACT_PHONE_DISPLAY = "684 80 90 44";
const CONTACT_PHONE_HREF = "+34684809044";
const CONTACT_LOCATION = "Irún, Guipuzkoa";

export default function Contacto() {
  const t = useTranslations("contacto");
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState<Status>("idle");
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!showToast) return;

    const timeoutId = setTimeout(() => {
      setShowToast(false);
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [showToast]);

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Contact request failed");

      setStatus("success");
      setShowToast(true);
      setFormData({ name: "", email: "", message: "" });
    } catch (error) {
      console.error("Error enviando el formulario de contacto:", error);
      setStatus("error");
    }
  }

  return (
    <>
      <div
        role="status"
        aria-live="polite"
        className={`${fraunces.variable} ${workSans.variable} fixed top-6 right-6 z-[100] flex items-center gap-3 rounded-2xl bg-[#005461] px-5 py-4 text-[#f4f4f4] shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition-opacity duration-300 font-[family-name:var(--font-work-sans)] ${
          showToast ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#00b7b5] text-xs font-bold text-[#005461]">
          ✓
        </span>
        <span className="text-[0.9rem]">{t("successText")}</span>
      </div>

      <section
        className={`${fraunces.variable} ${workSans.variable} bg-[#005461] px-8 pt-24 pb-16 font-[family-name:var(--font-work-sans)] max-[560px]:px-[1.2rem] max-[560px]:pt-16 max-[560px]:pb-12`}
      >
        <div className="mx-auto max-w-[1050px]">
          <div className="mx-auto mb-14 max-w-[560px] text-center">
            <span className="mb-[0.7rem] block text-[0.78rem] font-semibold tracking-[0.16em] text-[#00b7b5] uppercase">
              {t("eyebrow")}
            </span>
            <h2 className="mb-[0.9rem] font-[family-name:var(--font-fraunces)] text-[clamp(2rem,3.6vw,2.7rem)] font-normal text-[#f4f4f4]">
              {t("heading")}
            </h2>
            <p className="text-base leading-[1.6] font-light text-[#f4f4f4] opacity-75">
              {t("intro")}
            </p>
          </div>

          <div className="grid grid-cols-[0.85fr_1.15fr] items-start gap-14 max-[780px]:grid-cols-1 max-[780px]:gap-10">
            <div>
              <div className="mb-[1.8rem] flex items-start gap-4">
                <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border border-[rgba(244,244,244,0.25)]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-[18px] w-[18px] text-[#00b7b5]"
                  >
                    <path d="M4 4h16v16H4z" opacity="0" />
                    <path d="M22 6l-10 7L2 6" />
                    <path d="M2 6h20v12H2z" />
                  </svg>
                </div>
                <div>
                  <div className="mb-[0.2rem] text-[0.72rem] tracking-[0.05em] text-[#00b7b5] uppercase opacity-85">
                    {t("infoEmailLabel")}
                  </div>
                  <div className="text-base font-normal text-[#f4f4f4]">
                    <a
                      href={`mailto:${CONTACT_EMAIL}`}
                      className="text-inherit no-underline hover:underline"
                    >
                      {CONTACT_EMAIL}
                    </a>
                  </div>
                </div>
              </div>

              <div className="mb-[1.8rem] flex items-start gap-4">
                <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border border-[rgba(244,244,244,0.25)]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-[18px] w-[18px] text-[#00b7b5]"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <div>
                  <div className="mb-[0.2rem] text-[0.72rem] tracking-[0.05em] text-[#00b7b5] uppercase opacity-85">
                    {t("infoPhoneLabel")}
                  </div>
                  <div className="text-base font-normal text-[#f4f4f4]">
                    <a
                      href={`tel:${CONTACT_PHONE_HREF}`}
                      className="text-inherit no-underline hover:underline"
                    >
                      {CONTACT_PHONE_DISPLAY}
                    </a>
                  </div>
                </div>
              </div>

              <div className="mb-[1.8rem] flex items-start gap-4">
                <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border border-[rgba(244,244,244,0.25)]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-[18px] w-[18px] text-[#00b7b5]"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div>
                  <div className="mb-[0.2rem] text-[0.72rem] tracking-[0.05em] text-[#00b7b5] uppercase opacity-85">
                    {t("infoLocationLabel")}
                  </div>
                  <div className="text-base font-normal text-[#f4f4f4]">
                    {CONTACT_LOCATION}
                  </div>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className={`rounded-[20px] p-[2.2rem] max-[560px]:p-[1.6rem] ${styles.formGlass}`}
            >
              <div className="mb-[1.3rem]">
                <label
                  htmlFor="name"
                  className="mb-[0.4rem] block text-[0.78rem] tracking-[0.03em] text-[#f4f4f4] opacity-70"
                >
                  {t("formNameLabel")}
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t("namePlaceholder")}
                  required
                  className={styles.field}
                />
              </div>

              <div className="mb-[1.3rem]">
                <label
                  htmlFor="email"
                  className="mb-[0.4rem] block text-[0.78rem] tracking-[0.03em] text-[#f4f4f4] opacity-70"
                >
                  {t("formEmailLabel")}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t("emailPlaceholder")}
                  required
                  className={styles.field}
                />
              </div>

              <div className="mb-[1.3rem]">
                <label
                  htmlFor="message"
                  className="mb-[0.4rem] block text-[0.78rem] tracking-[0.03em] text-[#f4f4f4] opacity-70"
                >
                  {t("formMessageLabel")}
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder={t("messagePlaceholder")}
                  required
                  className={`min-h-[110px] resize-y ${styles.field}`}
                />
              </div>

              <button
                type="submit"
                disabled={status === "sending"}
                className="w-full cursor-pointer rounded-[10px] border-0 bg-[#00b7b5] py-[0.9rem] text-[0.98rem] font-semibold text-[#005461] transition-[background-color,transform] duration-200 hover:-translate-y-px hover:bg-[#33cfcd] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {status === "sending" ? t("sendingText") : t("submitButton")}
              </button>

              {status === "success" && (
                <p className="mt-[0.9rem] text-center text-[0.74rem] text-[#00b7b5]">
                  {t("successText")}
                </p>
              )}
              {status === "error" && (
                <p className="mt-[0.9rem] rounded-[10px] bg-[rgba(248,113,113,0.12)] py-3 text-center text-[0.95rem] font-medium text-red-300">
                  {t("errorText")}
                </p>
              )}
              {(status === "idle" || status === "sending") && (
                <p className="mt-[0.9rem] text-center text-[0.74rem] text-[#f4f4f4] opacity-50">
                  {t("formNote")}
                </p>
              )}
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
