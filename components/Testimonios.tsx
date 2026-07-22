"use client";

import { useState } from "react";
import { Fraunces, Work_Sans } from "next/font/google";
import { useTranslations } from "next-intl";
import styles from "./Testimonios.module.css";

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

type Testimonial = {
  quote: string;
  name: string;
  detail: string;
  initials: string;
};

// Cantidad de tarjetas visibles en desktop; solo se usa para calcular el
// índice máximo y la cantidad de dots (igual que en la referencia, no se
// recalcula por breakpoint). El ancho real de cada tarjeta por breakpoint
// lo maneja Testimonios.module.css vía la variable --visible.
const VISIBLE = 3;

export default function Testimonios() {
  const t = useTranslations("testimonios");
  const items = t.raw("items") as Testimonial[];
  const [currentIndex, setCurrentIndex] = useState(0);

  const maxIndex = Math.max(0, items.length - VISIBLE);

  function goNext() {
    setCurrentIndex((i) => (i >= maxIndex ? 0 : i + 1));
  }

  function goPrev() {
    setCurrentIndex((i) => (i <= 0 ? maxIndex : i - 1));
  }

  return (
    <section
      className={`${fraunces.variable} ${workSans.variable} overflow-hidden bg-[#dcf0ee] py-24 font-[family-name:var(--font-work-sans)] max-[560px]:py-16`}
    >
      {/*
        TODO: Estos son testimonios de EJEMPLO (nombres genéricos, texto placeholder).
        Reemplazar por testimonios reales de alumnos antes de publicar el sitio.
        No dejar este contenido inventado en producción.
      */}
      <div className="mx-auto flex max-w-[1100px] items-end justify-between gap-6 px-8 pb-10 max-[560px]:flex-col max-[560px]:items-start">
        <div>
          <span className="mb-[0.7rem] block text-[0.78rem] font-semibold tracking-[0.16em] text-[#00b7b5] uppercase">
            {t("eyebrow")}
          </span>
          <h2 className="font-[family-name:var(--font-fraunces)] text-[clamp(2rem,3.6vw,2.7rem)] font-normal text-[#005461]">
            {t("heading")}
          </h2>
        </div>

        <div className="flex shrink-0 gap-[0.7rem]">
          <button
            type="button"
            onClick={goPrev}
            aria-label={t("prevLabel")}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(0,84,97,0.25)] bg-white text-[#005461] transition-colors duration-200 hover:border-[#005461] hover:bg-[#005461] hover:text-white"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-[18px] w-[18px]"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label={t("nextLabel")}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(0,84,97,0.25)] bg-white text-[#005461] transition-colors duration-200 hover:border-[#005461] hover:bg-[#005461] hover:text-white"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-[18px] w-[18px]"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      <div
        className={`px-8 pt-[0.4rem] pb-[0.5rem] max-[560px]:px-[1.2rem] ${styles.viewport}`}
      >
        <div className="mx-auto max-w-[1100px] overflow-hidden">
          <div
            className={`flex gap-[1.4rem] ${styles.track}`}
            style={{
              transform: `translateX(calc(-${currentIndex} * (100% + 1.4rem) / var(--visible)))`,
            }}
          >
            {items.map((item, i) => (
              <div
                key={i}
                className={`flex flex-col rounded-[20px] bg-white px-[1.8rem] py-8 ${styles.card}`}
              >
                <div className="mb-[0.6rem] font-[family-name:var(--font-fraunces)] text-[3rem] leading-none text-[#00b7b5] opacity-30">
                  {'"'}
                </div>
                <p className="mb-[1.6rem] flex-1 text-[0.98rem] leading-[1.65] font-light text-[#142023] opacity-[0.82]">
                  {item.quote}
                </p>
                <div className="flex items-center gap-[0.8rem]">
                  <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-[#005461] font-[family-name:var(--font-fraunces)] text-[0.95rem] text-[#f4f4f4]">
                    {item.initials}
                  </div>
                  <div>
                    <div className="text-[0.9rem] font-medium text-[#005461]">
                      {item.name}
                    </div>
                    <div className="text-[0.76rem] text-[#018790] opacity-75">
                      {item.detail}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-2 flex justify-center gap-2">
        {Array.from({ length: maxIndex + 1 }).map((_, i) => (
          <span
            key={i}
            className={`h-[7px] w-[7px] rounded-full transition-[background-color,transform] duration-200 ${
              i === currentIndex
                ? "scale-[1.3] bg-[#00b7b5]"
                : "bg-[rgba(0,84,97,0.25)]"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
