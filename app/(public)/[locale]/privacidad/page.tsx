import type { Metadata } from "next";
import { Fraunces, Work_Sans } from "next/font/google";
import { getTranslations } from "next-intl/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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

type PrivacySection = {
  heading: string;
  paragraphs: string[];
  items?: string[];
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });

  return {
    title: t("title"),
    description: t("intro"),
  };
}

export default async function PrivacidadPage() {
  const t = await getTranslations("privacy");
  const sections = t.raw("sections") as PrivacySection[];

  return (
    <>
      <Navbar />
      <main
        className={`${fraunces.variable} ${workSans.variable} font-[family-name:var(--font-work-sans)]`}
      >
        {/*
          Navbar es fixed y transparente hasta hacer scroll, pensado para
          flotar sobre el Hero oscuro — esta página no tiene Hero, así que
          necesita su propia franja oscura arriba para que el texto claro
          del Navbar siga siendo legible incluso sin haber scrolleado.
        */}
        <div className="bg-[#005461] px-6 pt-[150px] pb-16 md:px-10">
          <div className="mx-auto max-w-[720px]">
            <h1 className="mb-2 font-[family-name:var(--font-fraunces)] text-[2.2rem] font-medium text-[#f4f4f4]">
              {t("title")}
            </h1>
            <p className="mb-5 text-[0.85rem] text-[#00b7b5]">
              {t("updated")}
            </p>
            <p className="text-[1.02rem] leading-[1.7] font-light text-[#f4f4f4] opacity-80">
              {t("intro")}
            </p>
          </div>
        </div>

        <div className="bg-[#f4f4f4] px-6 py-16 md:px-10">
          <div className="mx-auto max-w-[720px]">
            {sections.map((section, index) => (
              <section key={index} className="mb-9">
                <h2 className="mb-3 font-[family-name:var(--font-fraunces)] text-[1.25rem] font-medium text-[#005461]">
                  {section.heading}
                </h2>
                {section.paragraphs.map((paragraph, pIndex) => (
                  <p
                    key={pIndex}
                    className="mb-3 text-[0.95rem] leading-[1.7] font-light text-[#142023] opacity-80"
                  >
                    {paragraph}
                  </p>
                ))}
                {section.items && (
                  <ul className="list-disc space-y-2 pl-5 text-[0.95rem] leading-[1.6] font-light text-[#142023] opacity-80">
                    {section.items.map((item, iIndex) => (
                      <li key={iIndex}>{item}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
