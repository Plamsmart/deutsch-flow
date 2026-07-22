import Image from "next/image";
import { Fraunces, Work_Sans } from "next/font/google";
import { getTranslations } from "next-intl/server";
import styles from "./Hero.module.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-work-sans",
});

export default async function Hero() {
  const tHero = await getTranslations("hero");

  return (
    <section
      className={`${fraunces.variable} ${workSans.variable} relative flex min-h-screen flex-col overflow-hidden bg-[#0a0a0a] font-[family-name:var(--font-work-sans)]`}
    >
      <div className="relative z-[2] flex flex-1 flex-col items-center justify-center px-8 pt-24 pb-12 text-center md:pt-28">
        <span className="mb-[1.2rem] text-[0.8rem] font-semibold tracking-[0.18em] text-[#00b7b5] uppercase">
          {tHero("eyebrow")}
        </span>
        <h1 className="mb-[2.4rem] max-w-[680px] font-[family-name:var(--font-fraunces)] text-[2rem] leading-[1.1] font-normal text-[#f4f4f4] md:text-[clamp(2.2rem,4.6vw,3.4rem)]">
          {tHero("titleStart")}{" "}
          <em className="font-light text-[#00b7b5] italic">
            {tHero("titleEmphasis")}
          </em>
          ,
          <br />
          {tHero("titleEnd")}
        </h1>

        <div className="relative mb-[2.4rem] w-[min(440px,55vw)] md:w-[min(520px,48vw)]">
          <div className="relative aspect-square w-full">
            <div className={styles.ring} />
            <Image
              src="/images/portrait.png"
              alt="Retrato ilustrado de la profesora de alemán trabajando"
              fill
              sizes="(max-width: 768px) 55vw, 260px"
              className="relative rounded-full bg-[#f4f4f4] object-cover shadow-[0_20px_50px_rgba(0,84,97,0.25)]"
              priority
            />
          </div>

          <div
            className={`absolute -top-[40%] -right-[45%] z-[4] h-[70%] w-[70%] cursor-default ${styles.cluster}`}
          >
            <Image
              src="/images/stars.png"
              alt="Estrellas decorativas"
              width={175}
              height={160}
              className={`absolute inset-0 h-full w-full object-contain opacity-90 transition-opacity duration-300 ${styles.starsImg}`}
            />
            <Image
              src="/images/hummingbird.png"
              alt="Colibrí decorativo"
              width={250}
              height={250}
              className={`absolute top-[42%] left-[40%] w-[18%] origin-center drop-shadow-[0_6px_10px_rgba(0,0,0,0.4)] transition-[filter] duration-300 ${styles.hummingbirdImg}`}
            />
          </div>
        </div>

        <p className="mb-[2.3rem] max-w-[460px] text-[1.08rem] leading-[1.6] font-light text-[#f4f4f4] opacity-70">
          {tHero("subtitle")}
        </p>

        <div className="flex items-center gap-[1.8rem]">
          <a
            href="#contacto"
            className="inline-block rounded-sm bg-[#00b7b5] px-[2.3rem] py-4 text-base font-medium text-[#04282d] shadow-[0_4px_20px_rgba(0,183,181,0.3)] transition-[transform,box-shadow,background] duration-[250ms] ease-out hover:-translate-y-0.5 hover:bg-[#33cfcd] hover:shadow-[0_8px_26px_rgba(0,183,181,0.4)] motion-reduce:transition-none"
          >
            {tHero("ctaPrimary")}
          </a>
          <a
            href="#clases"
            className="border-b border-[rgba(244,244,244,0.35)] pb-0.5 text-[0.95rem] font-normal text-[#f4f4f4] transition-colors duration-200 hover:border-[#f4f4f4] motion-reduce:transition-none"
          >
            {tHero("ctaSecondary")}
          </a>
        </div>
      </div>

      <div className="relative z-[2] flex items-center justify-center gap-[0.8rem] pb-8 text-[0.78rem] tracking-[0.1em] text-[#00b7b5] opacity-70">
        <span className="h-px w-8 bg-[#00b7b5]" />
        <span>{tHero("scrollHint")}</span>
      </div>
    </section>
  );
}
