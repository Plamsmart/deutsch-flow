"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { Fraunces, Work_Sans } from "next/font/google";
import { createClient } from "@/lib/supabase/client";
import { routing } from "@/i18n/routing";
import { GERMAN_LEVEL_KEYS, GERMAN_LEVEL_LABELS } from "@/lib/germanLevels";

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
  const [fullName, setFullName] = useState("");
  const [germanLevel, setGermanLevel] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationSentTo, setConfirmationSentTo] = useState<string | null>(
    null,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedFullName = fullName.trim();
    if (!trimmedFullName) {
      setError("Ingresá tu nombre completo.");
      return;
    }
    if (!germanLevel) {
      setError("Elegí tu nivel de alemán.");
      return;
    }

    setIsSubmitting(true);

    // El formulario de registro no es locale-aware (fijo en español, como el
    // resto de /mi-cuenta), así que no hay un locale real que propagar acá —
    // se usa el default del sitio para el modal de bienvenida que se muestra
    // después de confirmar. emailRedirectTo apunta a la ruta de callback (no
    // directo a la página final): ahí es donde se canjea el ?code= por una
    // sesión antes de redirigir.
    const confirmedUrl = `/${routing.defaultLocale}?confirmed=1`;
    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(confirmedUrl)}`,
        // No se inserta en "profiles" desde el navegador: un trigger en
        // Supabase lee este mismo options.data al crearse el usuario y
        // rellena la fila de profiles solo.
        data: {
          full_name: trimmedFullName,
          german_level: germanLevel,
          phone: phone.trim() || null,
        },
      },
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
            htmlFor="fullName"
            className="mb-1 block text-[0.78rem] text-[#005461] opacity-80"
          >
            Nombre completo
          </label>
          <input
            type="text"
            id="fullName"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
            className="w-full rounded-[10px] border border-[rgba(0,84,97,0.18)] px-3 py-2 text-[0.9rem] text-[#142023] outline-none transition-colors duration-200 focus:border-[#00b7b5]"
          />
        </div>

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

        <div className="mb-4">
          <label
            htmlFor="germanLevel"
            className="mb-1 block text-[0.78rem] text-[#005461] opacity-80"
          >
            Nivel de alemán
          </label>
          <select
            id="germanLevel"
            value={germanLevel}
            onChange={(event) => setGermanLevel(event.target.value)}
            required
            className="w-full rounded-[10px] border border-[rgba(0,84,97,0.18)] px-3 py-2 text-[0.9rem] text-[#142023] outline-none transition-colors duration-200 focus:border-[#00b7b5]"
          >
            <option value="" disabled>
              Seleccioná tu nivel
            </option>
            {GERMAN_LEVEL_KEYS.map((levelKey) => (
              <option key={levelKey} value={levelKey}>
                {GERMAN_LEVEL_LABELS[levelKey]}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label
            htmlFor="phone"
            className="mb-1 block text-[0.78rem] text-[#005461] opacity-80"
          >
            Teléfono (opcional)
          </label>
          <input
            type="tel"
            id="phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="w-full rounded-[10px] border border-[rgba(0,84,97,0.18)] px-3 py-2 text-[0.9rem] text-[#142023] outline-none transition-colors duration-200 focus:border-[#00b7b5]"
          />
          <p className="mt-1 text-[0.72rem] text-[#005461] opacity-60">
            Para coordinar las clases, si lo prefieres
          </p>
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

        <p className="mt-4 text-center text-[0.72rem] text-[#005461] opacity-60">
          Usamos estos datos solo para gestionar tus clases.{" "}
          <Link
            href="/es/privacidad"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:opacity-80"
          >
            Política de privacidad
          </Link>
        </p>

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
