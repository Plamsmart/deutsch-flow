import { redirect } from "next/navigation";
import Link from "next/link";
import { Fraunces, Work_Sans } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import TestimonialForm from "@/components/admin/TestimonialForm";
import TestimonialItem from "@/components/admin/TestimonialItem";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-fraunces",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
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

export default async function ResenasAdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Mismo respaldo que en el resto de /admin: proxy.ts ya protege esta ruta
  // exigiendo que el email autenticado sea exactamente ADMIN_EMAIL.
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect("/admin/login");
  }

  const { data, error } = await supabase
    .from("testimonials")
    .select("id, student_name, rating, comment, detail, photo_url")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[admin] Error trayendo testimonials:", error);
  }

  const testimonials = (data ?? []) as TestimonialRow[];

  return (
    <main
      className={`${fraunces.variable} ${workSans.variable} min-h-screen bg-[#f4f4f4] px-6 py-10 font-[family-name:var(--font-work-sans)] md:px-10`}
    >
      <div className="mx-auto max-w-[1000px]">
        <div className="mb-8">
          <Link
            href="/admin"
            className="mb-2 inline-block text-[0.85rem] text-[#005461] opacity-70 hover:opacity-100"
          >
            ← Volver al listado
          </Link>
          <h1 className="font-[family-name:var(--font-fraunces)] text-[1.8rem] font-medium text-[#005461]">
            Reseñas
          </h1>
        </div>

        <section className="mb-10 rounded-[16px] border border-[rgba(0,84,97,0.1)] bg-white p-6 shadow-[0_6px_20px_rgba(0,84,97,0.06)]">
          <h2 className="mb-4 font-[family-name:var(--font-fraunces)] text-[1.15rem] font-medium text-[#005461]">
            Agregar reseña
          </h2>
          <TestimonialForm />
        </section>

        <h2 className="mb-4 font-[family-name:var(--font-fraunces)] text-[1.15rem] font-medium text-[#005461]">
          Reseñas publicadas ({testimonials.length})
        </h2>

        {testimonials.length === 0 ? (
          <p className="rounded-[16px] border border-[rgba(0,84,97,0.1)] bg-white p-6 text-center text-[0.9rem] text-[#005461] opacity-60">
            Todavía no hay reseñas. Agregá la primera arriba.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {testimonials.map((testimonial) => (
              <TestimonialItem
                key={testimonial.id}
                testimonial={{
                  id: testimonial.id,
                  studentName: testimonial.student_name,
                  rating: testimonial.rating,
                  comment: testimonial.comment,
                  detail: testimonial.detail,
                  photoUrl: testimonial.photo_url,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
