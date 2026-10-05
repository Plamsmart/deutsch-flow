import { Fraunces, Work_Sans } from "next/font/google";
import { getTranslations } from "next-intl/server";
import { createClient } from "@supabase/supabase-js";
import TestimoniosCarousel, {
  type TestimonialCardData,
} from "./TestimoniosCarousel";

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

type TestimonialRow = {
  id: string;
  student_name: string;
  rating: number;
  comment: string;
  detail: string | null;
  photo_url: string | null;
};

// Las reseñas se muestran tal como las escribió Gesa, sin traducir. Cliente
// sin cookies (anon key): la página pública sigue pudiendo prerenderizarse, y
// se revalida desde el panel con revalidatePath cuando cambian las reseñas.
function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

export default async function Testimonios() {
  const t = await getTranslations("testimonios");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data, error } = await supabase
    .from("testimonials")
    .select("id, student_name, rating, comment, detail, photo_url")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[testimonios] Error trayendo testimonials:", error);
  }

  const rows = (data ?? []) as TestimonialRow[];

  const items: TestimonialCardData[] = rows.map((row) => ({
    id: row.id,
    name: row.student_name,
    rating: row.rating,
    comment: row.comment,
    detail: row.detail,
    photoUrl: row.photo_url,
    initials: getInitials(row.student_name),
    ratingLabel: t("ratingLabel", { rating: row.rating }),
  }));

  return (
    <section
      id="testimonios"
      className={`${fraunces.variable} ${workSans.variable} scroll-mt-24 overflow-hidden bg-[#dcf0ee] py-24 font-[family-name:var(--font-work-sans)] max-[560px]:py-16`}
    >
      <TestimoniosCarousel
        eyebrow={t("eyebrow")}
        heading={t("heading")}
        prevLabel={t("prevLabel")}
        nextLabel={t("nextLabel")}
        emptyText={t("emptyText")}
        items={items}
      />
    </section>
  );
}
