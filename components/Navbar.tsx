"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import LanguageSwitcher from "./LanguageSwitcher";

const SCROLL_THRESHOLD = 80;

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const locale = useLocale();
  const tNav = useTranslations("nav");

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > SCROLL_THRESHOLD);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-6 transition-[background-color,backdrop-filter] duration-300 md:px-16 md:py-8 ${
        scrolled
          ? "bg-[rgba(0,84,97,0.65)] backdrop-blur-md"
          : "bg-transparent backdrop-blur-none"
      }`}
    >
      <Image
        src="/images/flowOlas.png"
        alt={tNav("logoAlt")}
        width={1083}
        height={442}
        className="h-18 w-auto"
        priority
      />
      <div className="flex items-center gap-6 md:gap-10">
        <ul className="hidden gap-10 md:flex">
          <li>
            <a
              href="#sobre-mi"
              className="text-[0.95rem] font-normal tracking-[0.03em] text-[#f4f4f4] opacity-85 transition-opacity duration-200 hover:opacity-100"
            >
              {tNav("sobreMi")}
            </a>
          </li>
          <li>
            <a
              href="#clases"
              className="text-[0.95rem] font-normal tracking-[0.03em] text-[#f4f4f4] opacity-85 transition-opacity duration-200 hover:opacity-100"
            >
              {tNav("clases")}
            </a>
          </li>
          <li>
            <a
              href="#testimonios"
              className="text-[0.95rem] font-normal tracking-[0.03em] text-[#f4f4f4] opacity-85 transition-opacity duration-200 hover:opacity-100"
            >
              {tNav("testimonios")}
            </a>
          </li>
          <li>
            <a
              href="#contacto"
              className="text-[0.95rem] font-normal tracking-[0.03em] text-[#f4f4f4] opacity-85 transition-opacity duration-200 hover:opacity-100"
            >
              {tNav("contacto")}
            </a>
          </li>
        </ul>

        <LanguageSwitcher currentLocale={locale} />
      </div>
    </nav>
  );
}
