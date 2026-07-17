"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export default function LanguageSwitcher({
  currentLocale,
}: {
  currentLocale: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const otherLocales = routing.locales.filter((loc) => loc !== currentLocale);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.95rem] font-normal tracking-[0.03em] text-[#f4f4f4] transition-colors duration-200 ${
          open ? "border-[#00b7b5]" : "border-[#f4f4f4]/35 hover:border-[#00b7b5]"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className={`h-3.5 w-3.5 transition-colors duration-200 ${
            open ? "text-[#00b7b5]" : "text-[#f4f4f4] group-hover:text-[#00b7b5]"
          }`}
        >
          <circle cx="12" cy="12" r="9" />
          <ellipse cx="12" cy="12" rx="4" ry="9" />
          <line x1="3" y1="12" x2="21" y2="12" />
        </svg>
        <span>{currentLocale.toUpperCase()}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-2.5 w-2.5 transition-transform duration-200 ${open ? "rotate-180" : ""} ${
            open ? "text-[#00b7b5]" : "text-[#f4f4f4] group-hover:text-[#00b7b5]"
          }`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute top-[calc(100%+0.5rem)] right-0 z-10 min-w-[5rem] overflow-hidden rounded-lg border border-[#f4f4f4]/15 bg-[#0a0a0a] py-1 shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
        >
          {otherLocales.map((loc) => (
            <li key={loc}>
              <Link
                href="/"
                locale={loc}
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-[0.95rem] font-normal tracking-[0.03em] text-[#f4f4f4] transition-colors duration-150 hover:text-[#00b7b5]"
              >
                {loc.toUpperCase()}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
