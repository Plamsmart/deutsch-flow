"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Fraunces, Work_Sans } from "next/font/google";
import { createClient } from "@/lib/supabase/client";

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

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("Email o contraseña incorrectos.");
      setIsSubmitting(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <main
      className={`${fraunces.variable} ${workSans.variable} flex min-h-screen items-center justify-center bg-[#f4f4f4] px-6 font-[family-name:var(--font-work-sans)]`}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[380px] rounded-[20px] border border-[rgba(0,84,97,0.1)] bg-white p-8 shadow-[0_6px_20px_rgba(0,84,97,0.06)]"
      >
        <h1 className="mb-6 text-center font-[family-name:var(--font-fraunces)] text-[1.6rem] font-medium text-[#005461]">
          Panel de administración
        </h1>

        <div className="mb-4">
          <label
            htmlFor="email"
            className="mb-1 block text-[0.78rem] text-[#005461] opacity-80"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full rounded-[10px] border border-[rgba(0,84,97,0.18)] px-3 py-2 text-[0.9rem] text-[#142023] outline-none transition-colors duration-200 focus:border-[#00b7b5]"
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="password"
            className="mb-1 block text-[0.78rem] text-[#005461] opacity-80"
          >
            Contraseña
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="w-full rounded-[10px] border border-[rgba(0,84,97,0.18)] px-3 py-2 text-[0.9rem] text-[#142023] outline-none transition-colors duration-200 focus:border-[#00b7b5]"
          />
        </div>

        {error && (
          <p className="mb-4 text-center text-[0.85rem] text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-[10px] bg-[#00b7b5] py-3 text-[0.95rem] font-semibold text-[#005461] transition-colors duration-200 hover:bg-[#33cfcd] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </main>
  );
}
