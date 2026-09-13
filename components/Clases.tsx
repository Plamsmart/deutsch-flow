import { Fraunces, Work_Sans } from "next/font/google";
import { getTranslations } from "next-intl/server";
import type { PlanId } from "@/lib/plans";
import BuyButton from "./BuyButton";
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
  {
    key: "conversacion",
    featureKeys: ["f1", "f2", "f3"],
    amount: "10€",
    unit: "perSession",
    hasPerHour: false,
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
