import Image from "next/image";
import { Fraunces, Work_Sans } from "next/font/google";
import { getTranslations } from "next-intl/server";
import styles from "./About.module.css";

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

const cardShell = "rounded-[20px] shadow-[0_6px_20px_rgba(0,84,97,0.06)]";
const cardPadding = "px-[1.8rem] py-[1.6rem]";
const cardParagraph =
  "text-[0.98rem] leading-[1.65] font-light text-[#142023] opacity-[0.82]";
const photoCard = `${cardShell} bg-[#005461] flex aspect-square items-center justify-center overflow-hidden max-[680px]:aspect-[4/3]`;

export default async function About() {
  const t = await getTranslations("about");

  return (
    <section
      className={`${fraunces.variable} ${workSans.variable} flex min-h-screen items-center bg-[#dcf0ee] px-8 py-20 font-[family-name:var(--font-work-sans)] max-[680px]:px-[1.2rem] max-[680px]:py-14`}
    >
      <div className="mx-auto w-full max-w-[880px]">
        <div className={styles.bento}>
          <div className={photoCard}>
            <div className="relative aspect-square w-[38%] max-[340px]:w-[45%]">
              <div className={styles.photoRing} />
              <Image
                src="/images/gesa-portrait.png"
                alt="Gesa Nommsen"
                fill
                sizes="(max-width: 340px) 45vw, 200px"
                className="relative rounded-full object-cover"
              />
            </div>
          </div>

          <div className={`${cardShell} ${cardPadding} bg-white`}>
            <span className="mb-2 block text-[0.78rem] font-semibold tracking-[0.16em] text-[#00b7b5] uppercase">
              {t("eyebrow")}
            </span>
            <h2 className="mb-[0.9rem] font-[family-name:var(--font-fraunces)] text-[clamp(1.7rem,3vw,2.1rem)] font-normal text-[#005461]">
              Gesa Nommsen
            </h2>
            <p className={`${cardParagraph} mt-[0.6rem] text-base`}>
              {t("intro")}
            </p>
          </div>

          <div
            className={`${cardShell} ${cardPadding} bg-white ${styles.span2}`}
          >
            <p className={cardParagraph}>{t("p1")}</p>
          </div>

          <div
            className={`${cardShell} ${cardPadding} flex items-center bg-white`}
          >
            <p className={cardParagraph}>{t("p2")}</p>
          </div>

          <div className={photoCard}>
            <div className="relative aspect-square w-[68%] max-[680px]:w-[45%]">
              <div className={styles.photoRing} />
              <Image
                src="/images/pellworm-lighthouse.png"
                alt={t("faroAlt")}
                fill
                sizes="(max-width: 680px) 45vw, 200px"
                className="relative rounded-full object-cover"
              />
            </div>
          </div>

          <div
            className={`${cardShell} ${cardPadding} bg-white ${styles.span2}`}
          >
            <p className={cardParagraph}>{t("p3")}</p>
          </div>

          <div
            className={`${cardShell} ${cardPadding} bg-[#dcf0ee] ${styles.span2}`}
          >
            <p className="text-center text-[1.02rem] leading-[1.65] font-light text-[#005461] italic opacity-95">
              {t("closing")}
            </p>
          </div>
        </div>

        <div className="mt-[1.6rem] flex flex-wrap justify-center divide-x divide-[rgba(0,84,97,0.18)] max-[680px]:divide-x-0">
          <div className="px-[1.6rem] py-[0.4rem] text-center max-[680px]:px-[1rem] max-[680px]:py-[0.6rem]">
            <div className="font-[family-name:var(--font-fraunces)] text-[1.05rem] font-medium text-[#005461]">
              {t("credentials.nativeValue")}
            </div>
            <div className="mt-[0.15rem] text-[0.66rem] tracking-[0.05em] text-[#018790] uppercase opacity-75">
              {t("credentials.nativeLabel")}
            </div>
          </div>
          <div className="px-[1.6rem] py-[0.4rem] text-center max-[680px]:px-[1rem] max-[680px]:py-[0.6rem]">
            <div className="font-[family-name:var(--font-fraunces)] text-[1.05rem] font-medium text-[#005461]">
              {t("credentials.masterValue")}
            </div>
            <div className="mt-[0.15rem] text-[0.66rem] tracking-[0.05em] text-[#018790] uppercase opacity-75">
              {t("credentials.masterLabel")}
            </div>
          </div>
          <div className="px-[1.6rem] py-[0.4rem] text-center max-[680px]:px-[1rem] max-[680px]:py-[0.6rem]">
            <div className="font-[family-name:var(--font-fraunces)] text-[1.05rem] font-medium text-[#005461]">
              {t("credentials.expValue")}
            </div>
            <div className="mt-[0.15rem] text-[0.66rem] tracking-[0.05em] text-[#018790] uppercase opacity-75">
              {t("credentials.expLabel")}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
