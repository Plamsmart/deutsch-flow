import { Fraunces, Work_Sans } from "next/font/google";
import { getTranslations } from "next-intl/server";
import type { PlanId } from "@/lib/plans";
import BuyButton from "./BuyButton";
import CoffeeBreakButton from "./CoffeeBreakButton";
import styles from "./Clases.module.css";

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

type Plan = {
  key: PlanId;
  featureKeys: string[];
  amount: string;
  unit: "perPackage" | "perSession" | null;
  hasPerHour: boolean;
  featured?: boolean;
};

const individualPlans: Plan[] = [
  {
    key: "suelta",
    featureKeys: ["f1", "f2"],
    amount: "25€",
    unit: null,
    hasPerHour: false,
  },
  {
    key: "p4",
    featureKeys: ["f1", "f2"],
    amount: "96€",
    unit: "perPackage",
    hasPerHour: true,
  },
  {
    key: "p8",
    featureKeys: ["f1", "f2"],
    amount: "190€",
    unit: "perPackage",
    hasPerHour: true,
    featured: true,
  },
  {
    key: "p12",
    featureKeys: ["f1", "f2"],
    amount: "282€",
    unit: "perPackage",
    hasPerHour: true,
  },
];

// "conversacion" (Grupo de Conversación) ya no se arma con renderPlan(): la
// tarjeta "German Coffee Break" la reemplaza visualmente (mismos f1/f2/f3 de
// clases.grupal.conversacion, pero con marca/precio/capacidad propios desde
// el namespace "coffeeBreak") — ver renderCoffeeBreakCard() más abajo.
const grupalPlans: Plan[] = [
  {
    key: "pareja",
    featureKeys: ["f1", "f2"],
    amount: "128€",
    unit: "perPackage",
    hasPerHour: true,
  },
  {
    key: "reducido",
    featureKeys: ["f1", "f2"],
    amount: "104€",
    unit: "perPackage",
    hasPerHour: true,
  },
];

const cardBase =
  "relative flex flex-col rounded-[18px] border border-[rgba(0,84,97,0.1)] bg-white px-[1.5rem] py-[1.8rem] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(0,84,97,0.1)]";
const featuredExtra =
  "border-[#00b7b5] shadow-[0_10px_26px_rgba(0,183,181,0.15)]";
const gridBase =
  "grid gap-[1.2rem] max-[900px]:grid-cols-2 max-[560px]:grid-cols-1";

export default async function Clases() {
  const t = await getTranslations("clases");
  const tCoffee = await getTranslations("coffeeBreak");

  function renderPlan(group: "individual" | "grupal", plan: Plan) {
    const base = `${group}.${plan.key}`;

    return (
      <div
        key={plan.key}
        className={`${cardBase} ${plan.featured ? featuredExtra : ""}`}
      >
        {plan.featured && <span className={styles.badge}>{t("badge")}</span>}

        <h3 className="mb-4 font-[family-name:var(--font-fraunces)] text-[1.15rem] font-medium text-[#005461]">
          {t(`${base}.title`)}
        </h3>

        <ul className="mb-[1.4rem] flex-1 list-none">
          {plan.featureKeys.map((fk) => (
            <li
              key={fk}
              className={`mb-2 flex items-start gap-2 text-[0.88rem] leading-[1.5] font-light text-[#142023] opacity-[0.78] ${styles.feature}`}
            >
              {t(`${base}.${fk}`)}
            </li>
          ))}
        </ul>

        {/* Solo "conversacion" tiene esta clave — el resto de los planes no
            la definen en messages/, así que se chequea con t.has() antes de
            renderizarla. */}
        {t.has(`${base}.nota`) && (
          <p className="mb-[1.2rem] flex items-center gap-1.5 text-[0.76rem] italic text-[#005461] opacity-70">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3.5 w-3.5 shrink-0"
            >
              <circle cx="12" cy="12" r="9" />
              <line x1="12" y1="8" x2="12" y2="8.01" />
              <line x1="12" y1="11" x2="12" y2="16" />
            </svg>
            {t(`${base}.nota`)}
          </p>
        )}

        <div className="flex items-baseline gap-[0.3rem] border-t border-[rgba(0,84,97,0.1)] pt-[1.1rem]">
          <span className="font-[family-name:var(--font-fraunces)] text-[1.9rem] font-medium text-[#005461]">
            {plan.amount}
          </span>
          {plan.unit && (
            <span className="text-[0.8rem] text-[#018790] opacity-75">
              {t(plan.unit)}
            </span>
          )}
          {plan.hasPerHour && (
            <span className="mt-[0.2rem] block text-[0.72rem] text-[#018790] opacity-60">
              {t(`${base}.perHour`)}
            </span>
          )}
        </div>

        <BuyButton
          planId={plan.key}
          planTitle={t(`${base}.title`)}
          priceLabel={plan.amount}
        />
      </div>
    );
  }

  // Tarjeta destacada "German Coffee Break": reemplaza visualmente al plan
  // "conversacion" en el grid grupal. Reutiliza los f1/f2/f3 ya existentes
  // de clases.grupal.conversacion (duración/frecuencia/temas, sin cambios),
  // pero el resto de los textos (marca, precio, capacidad) vienen del
  // namespace "coffeeBreak" agregado para esto. No usa BuyButton/Stripe:
  // CoffeeBreakButton inserta directo en Supabase vía RLS pública.
  function renderCoffeeBreakCard() {
    return (
      <div
        key="coffee-break"
        className="relative flex flex-col rounded-[18px] border-2 border-[#00b7b5] bg-white px-[1.5rem] py-[1.8rem] shadow-[0_14px_34px_rgba(0,183,181,0.18)] transition-[transform,box-shadow,border-color] duration-[350ms] ease-out hover:-translate-y-1 hover:border-[#33cfcd] hover:shadow-[0_0_0_1px_rgba(0,183,181,0.4),0_6px_16px_rgba(0,183,181,0.25),0_20px_50px_rgba(0,183,181,0.4),0_0_60px_rgba(0,183,181,0.25)]"
      >
        <span className={styles.badge}>{tCoffee("badge")}</span>

        <div className="mt-1 mb-[0.3rem] flex items-center gap-[0.7rem]">
          <svg
            viewBox="0 0 48 48"
            fill="none"
            stroke="#005461"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-[30px] w-[30px] shrink-0"
          >
            <path d="M8,18 L8,34 Q8,40 14,40 L28,40 Q34,40 34,34 L34,18 Z" />
            <path d="M34,20 L38,20 Q42,20 42,25 Q42,30 38,30 L34,30" />
            <path d="M14,10 Q13,13 15,15 Q17,17 16,20" opacity="0.6" />
            <path d="M21,8 Q20,11 22,13 Q24,15 23,18" opacity="0.6" />
            <path d="M28,10 Q27,13 29,15 Q31,17 30,20" opacity="0.6" />
          </svg>
          <h3 className="font-[family-name:var(--font-fraunces)] text-[1.2rem] leading-[1.2] font-medium text-[#005461]">
            {tCoffee("title")}
          </h3>
        </div>
        <p className="mb-4 text-[0.78rem] text-[#018790] opacity-85">
          {tCoffee("subtitle")}
        </p>

        <ul className="mb-[0.9rem] flex-1 list-none">
          {["f1", "f2", "f3"].map((fk) => (
            <li
              key={fk}
              className={`mb-2 flex items-start gap-2 text-[0.88rem] leading-[1.5] font-light text-[#142023] opacity-[0.78] ${styles.feature}`}
            >
              {t(`grupal.conversacion.${fk}`)}
            </li>
          ))}
        </ul>

        <div className="mb-[1.1rem] rounded-[10px] border border-[rgba(0,183,181,0.25)] bg-[rgba(0,183,181,0.08)] px-[0.7rem] py-[0.5rem] text-center text-[0.76rem] text-[#005461]">
          {tCoffee("capacityNote")}
        </div>

        <div className="mb-4 flex items-baseline gap-[0.3rem] border-t border-[rgba(0,84,97,0.1)] pt-[1rem]">
          <span className="font-[family-name:var(--font-fraunces)] text-[1.7rem] font-medium text-[#005461]">
            12€
          </span>
          <span className="text-[0.8rem] text-[#018790] opacity-75">
            {t("perSession")}
          </span>
        </div>

        <CoffeeBreakButton />
      </div>
    );
  }

  return (
    <section
      id="clases"
      className={`${fraunces.variable} ${workSans.variable} scroll-mt-24 bg-[#f4f4f4] px-8 py-24 font-[family-name:var(--font-work-sans)] max-[560px]:px-[1.2rem] max-[560px]:py-16`}
    >
      <div className="mx-auto max-w-[1100px]">
        <div className="mx-auto mb-16 max-w-[560px] text-center">
          <span className="mb-[0.7rem] block text-[0.78rem] font-semibold tracking-[0.16em] text-[#00b7b5] uppercase">
            {t("eyebrow")}
          </span>
          <h2 className="mb-[0.9rem] font-[family-name:var(--font-fraunces)] text-[clamp(2rem,3.6vw,2.7rem)] font-normal text-[#005461]">
            {t("heading")}
          </h2>
          <p className="text-[1.02rem] leading-[1.6] font-light text-[#142023] opacity-75">
            {t("intro")}
          </p>
        </div>

        <div
          className={`mt-[3.5rem] mb-6 flex items-center gap-4 font-[family-name:var(--font-fraunces)] text-[1.3rem] font-medium text-[#005461] ${styles.groupLabel}`}
        >
          {t("individualLabel")}
        </div>
        <div className={`${gridBase} grid-cols-4`}>
          {individualPlans.map((plan) => renderPlan("individual", plan))}
        </div>

        <div
          className={`mt-[3.5rem] mb-6 flex items-center gap-4 font-[family-name:var(--font-fraunces)] text-[1.3rem] font-medium text-[#005461] ${styles.groupLabel}`}
        >
          {t("grupalLabel")}
        </div>
        <div className={`${gridBase} grid-cols-3`}>
          {grupalPlans.map((plan) => renderPlan("grupal", plan))}
          {renderCoffeeBreakCard()}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-xl border border-[rgba(0,183,181,0.3)] bg-[rgba(0,183,181,0.08)] px-5 py-3">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 shrink-0 text-[#00b7b5]"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" />
            </svg>
            <p className="text-[0.9rem] font-medium text-[#005461]">
              {t("durationNote")}
            </p>
          </div>

          <div className="inline-flex items-start gap-2 px-5 py-3">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 shrink-0 text-[#00b7b5]"
            >
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M3 10h18" />
              <path d="M8 3v4" />
              <path d="M16 3v4" />
            </svg>
            <p className="text-[0.9rem] font-medium text-[#005461]">
              {t("cancellationNote")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
