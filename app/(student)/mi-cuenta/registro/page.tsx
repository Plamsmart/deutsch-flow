"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
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

export default function RegistroPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationSentTo, setConfirmationSentTo] = useState<string | null>(
    null,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(
        signUpError.message === "User already registered"
          ? "Ya existe una cuenta con ese email. Iniciá sesión en su lugar."
          : "No pudimos crear tu cuenta. Revisá los datos e intentá de nuevo.",
      );
      setIsSubmitting(false);
      return;
    }

    // La confirmación de email está activada en Supabase: todavía no hay
    // sesión utilizable acá, así que no redirigimos a /mi-cuenta — nos
    // quedamos en esta pantalla mostrando el mensaje de "revisá tu email".
    setConfirmationSentTo(email);
    setIsSubmitting(false);
  }

  if (confirmationSentTo) {
    return (
      <main
        className={`${fraunces.variable} ${workSans.variable} flex min-h-screen items-center justify-center bg-[#f4f4f4] px-6 font-[family-name:var(--font-work-sans)]`}
      >
        <div className="w-full max-w-[420px] rounded-[20px] border border-[rgba(0,84,97,0.1)] bg-white p-8 text-center shadow-[0_6px_20px_rgba(0,84,97,0.06)]">
          <h1 className="mb-3 font-[family-name:var(--font-fraunces)] text-[1.4rem] font-medium text-[#005461]">
            Revisá tu email
          </h1>
          <p className="text-[0.9rem] text-[#142023] opacity-80">
            Te enviamos un email de confirmación a{" "}
            <strong>{confirmationSentTo}</strong>. Revisá tu bandeja de
            entrada (y la carpeta de spam) para activar tu cuenta.
          </p>
          <Link
            href="/mi-cuenta/login"
            className="mt-6 inline-block text-[0.85rem] font-medium text-[#00b7b5] hover:underline"
          >
            Ya confirmé mi email — Iniciar sesión
          </Link>
        </div>
      </main>
    );
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
          Crear cuenta
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
            minLength={6}
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
          {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
        </button>

        <p className="mt-5 text-center text-[0.82rem] text-[#005461] opacity-70">
          ¿Ya tenés cuenta?{" "}
          <Link
            href="/mi-cuenta/login"
            className="font-medium text-[#00b7b5] hover:underline"
          >
            Iniciar sesión
          </Link>
        </p>
      </form>
    </main>
  );
}
