import Image from "next/image";
import { Fraunces, Work_Sans } from "next/font/google";
import { getTranslations } from "next-intl/server";
import styles from "./Footer.module.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-fraunces",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-work-sans",
});

const linkClass =
  "text-[0.88rem] text-[#f4f4f4] no-underline opacity-75 transition-[opacity,color] duration-200 hover:text-[#00b7b5] hover:opacity-100";

export default async function Footer() {
  const t = await getTranslations("footer");
  const tNav = await getTranslations("nav");

  return (
    <footer
      className={`${fraunces.variable} ${workSans.variable} bg-[#0a0a0a] px-8 pt-[3.2rem] pb-[1.8rem] font-[family-name:var(--font-work-sans)]`}
    >
      <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-[1.6rem] border-b border-[rgba(244,244,244,0.12)] pb-[1.8rem] max-[600px]:flex-col max-[600px]:text-center">
        <div className="flex items-center gap-[0.7rem]">
          <Image
            src="/images/faro-solo-icono.png"
            alt={tNav("logoAlt")}
            width={390}
            height={639}
            className="h-18 w-auto"
          />
          <div className="font-[family-name:var(--font-fraunces)] text-[1.3rem] font-medium tracking-[0.02em] text-[#f4f4f4]">
            Deutsch{" "}
            <span className="relative">
              Flow
              <svg
                className={`absolute -bottom-[5px] left-0 h-[9px] w-full overflow-visible ${styles.flowWord}`}
                viewBox="0 0 100 10"
                preserveAspectRatio="none"
              >
                <path d="M2,6 Q25,2 50,6 T98,5" />
              </svg>
            </span>
          </div>
        </div>

        <ul className="flex list-none flex-wrap gap-8 max-[600px]:justify-center max-[600px]:gap-[1.4rem]">
          <li>
            <a href="#sobre-mi" className={linkClass}>
              {t("sobreMi")}
            </a>
          </li>
          <li>
            <a href="#clases" className={linkClass}>
              {t("clases")}
            </a>
          </li>
          <li>
            <a href="#testimonios" className={linkClass}>
              {t("testimonios")}
            </a>
          </li>
          <li>
            <a href="#contacto" className={linkClass}>
              {t("contacto")}
            </a>
          </li>
        </ul>

        <Image
          src="/images/stamp-sheep.png"
          alt="Sello Pellworm Nordsee"
          width={339}
          height={283}
          className="h-auto w-[160px] shrink-0 opacity-90"
        />
      </div>

      <p className="mx-auto mt-[1.6rem] max-w-[1100px] text-center text-[0.76rem] text-[#f4f4f4] opacity-45">
        {t("copyright")}
      </p>
    </footer>
  );
}
