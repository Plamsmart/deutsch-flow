"use client";

import { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import StarRating from "./StarRating";
import styles from "./Testimonios.module.css";

export type TestimonialCardData = {
  id: string;
  name: string;
  rating: number;
  comment: string;
  detail: string | null;
  photoUrl: string | null;
  initials: string;
  ratingLabel: string;
};

// Mismos breakpoints que Testimonios.module.css (variable --visible). El
// servidor y el primer render de hidratación usan DESKTOP_VISIBLE; después
// el valor real se toma de matchMedia.
const DESKTOP_VISIBLE = 3;
const TABLET_QUERY = "(max-width: 860px)";
const MOBILE_QUERY = "(max-width: 560px)";

function subscribeToBreakpoints(onChange: () => void) {
  const queries = [
    window.matchMedia(TABLET_QUERY),
    window.matchMedia(MOBILE_QUERY),
  ];
  queries.forEach((query) => query.addEventListener("change", onChange));
  return () =>
    queries.forEach((query) => query.removeEventListener("change", onChange));
}

function getVisibleCount() {
  if (window.matchMedia(MOBILE_QUERY).matches) return 1;
  if (window.matchMedia(TABLET_QUERY).matches) return 2;
  return DESKTOP_VISIBLE;
}

function getServerVisibleCount() {
  return DESKTOP_VISIBLE;
}

function useVisibleCount() {
  return useSyncExternalStore(
    subscribeToBreakpoints,
    getVisibleCount,
    getServerVisibleCount,
  );
}

export default function TestimoniosCarousel({
  eyebrow,
  heading,
  prevLabel,
  nextLabel,
  emptyText,
  items,
}: {
  eyebrow: string;
  heading: string;
  prevLabel: string;
  nextLabel: string;
  emptyText: string;
  items: TestimonialCardData[];
}) {
  const visible = useVisibleCount();
  const [currentIndex, setCurrentIndex] = useState(0);

  const maxIndex = Math.max(0, items.length - visible);
  const showControls = items.length > visible;

  // Si al cambiar de breakpoint (ej. girar el celular) el índice quedó por
  // encima del nuevo máximo, se ajusta durante el render (patrón oficial de
  // React para estado derivado; un useEffect con setState dispara el lint).
  if (currentIndex > maxIndex) {
    setCurrentIndex(maxIndex);
  }

  function goNext() {
    setCurrentIndex((i) => (i >= maxIndex ? 0 : i + 1));
  }

  function goPrev() {
    setCurrentIndex((i) => (i <= 0 ? maxIndex : i - 1));
  }

  return (
    <>
      <div className="mx-auto flex max-w-[1100px] items-end justify-between gap-6 px-8 pb-10 max-[560px]:flex-col max-[560px]:items-start">
        <div>
          <span className="mb-[0.7rem] block text-[0.78rem] font-semibold tracking-[0.16em] text-[#00b7b5] uppercase">
            {eyebrow}
          </span>
          <h2 className="font-[family-name:var(--font-fraunces)] text-[clamp(2rem,3.6vw,2.7rem)] font-normal text-[#005461]">
            {heading}
          </h2>
        </div>

        {showControls && (
          <div className="flex shrink-0 gap-[0.7rem]">
            <button
              type="button"
              onClick={goPrev}
              aria-label={prevLabel}
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
              aria-label={nextLabel}
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
        )}
      </div>

      {items.length === 0 ? (
        <p className="mx-auto max-w-[560px] px-8 text-center text-[1rem] leading-[1.6] font-light text-[#142023] opacity-75 max-[560px]:px-[1.2rem]">
          {emptyText}
        </p>
      ) : (
        <>
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
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`flex flex-col rounded-[20px] bg-white px-[1.8rem] py-8 ${styles.card}`}
                  >
                    <div className="mb-[0.6rem] font-[family-name:var(--font-fraunces)] text-[3rem] leading-none text-[#00b7b5] opacity-30">
                      {'"'}
                    </div>
                    <StarRating
                      rating={item.rating}
                      ariaLabel={item.ratingLabel}
                      className="mb-[0.9rem]"
                    />
                    <p className="mb-[1.6rem] flex-1 text-[0.98rem] leading-[1.65] font-light text-[#142023] opacity-[0.82]">
                      {item.comment}
                    </p>
                    <div className="flex items-center gap-[0.8rem]">
                      <div className="relative flex h-[42px] w-[42px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#005461] font-[family-name:var(--font-fraunces)] text-[0.95rem] text-[#f4f4f4]">
                        {item.photoUrl ? (
                          <Image
                            src={item.photoUrl}
                            alt=""
                            fill
                            sizes="84px"
                            quality={90}
                            className="object-cover"
                          />
                        ) : (
                          item.initials
                        )}
                      </div>
                      <div>
                        <div className="text-[0.9rem] font-medium text-[#005461]">
                          {item.name}
                        </div>
                        {item.detail && (
                          <div className="text-[0.76rem] text-[#018790] opacity-75">
                            {item.detail}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {showControls && (
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
          )}
        </>
      )}
    </>
  );
}
