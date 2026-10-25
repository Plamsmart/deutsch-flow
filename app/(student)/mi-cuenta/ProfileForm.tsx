"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { GERMAN_LEVEL_KEYS, GERMAN_LEVEL_LABELS } from "@/lib/germanLevels";

type Status = "idle" | "saving" | "success" | "error";

export default function ProfileForm({
  userId,
  initialFullName,
  initialPhone,
  initialGermanLevel,
}: {
  userId: string;
  initialFullName: string;
  initialPhone: string;
  initialGermanLevel: string;
}) {
  const [fullName, setFullName] = useState(initialFullName);
  const [phone, setPhone] = useState(initialPhone);
  const [germanLevel, setGermanLevel] = useState(initialGermanLevel);
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedFullName = fullName.trim();
    if (!trimmedFullName || !germanLevel) {
      setStatus("error");
      return;
    }

    setStatus("saving");

    const supabase = createClient();
    // La policy de RLS de "profiles" ya limita esto a la propia fila
    // (auth.uid() = id) — .eq("id", userId) es solo para que la query
    // apunte a la fila correcta, no es lo que la protege.
    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name: trimmedFullName,
        phone: phone.trim() || null,
        german_level: germanLevel,
      })
      .eq("id", userId)
      .select("id");

    // 0 filas devueltas (sin error) significa que el update no encontró o no
    // pudo tocar la fila — ej. si todavía no existe un profile para este
    // usuario (alguien que se registró antes de que existiera esta tabla).
    // En ese caso tampoco mostramos éxito.
    if (error || !data || data.length === 0) {
      console.error("[mi-cuenta] Error actualizando el perfil:", error);
      setStatus("error");
      return;
    }

    setStatus("success");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2"
    >
      <div>
        <label
          htmlFor="profile-fullName"
          className="mb-1 block text-[0.78rem] text-[#005461] opacity-80"
        >
          Nombre completo
        </label>
        <input
          type="text"
          id="profile-fullName"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
          className="w-full rounded-[10px] border border-[rgba(0,84,97,0.18)] px-3 py-2 text-[0.9rem] text-[#142023] outline-none transition-colors duration-200 focus:border-[#00b7b5]"
        />
      </div>

      <div>
        <label
          htmlFor="profile-germanLevel"
          className="mb-1 block text-[0.78rem] text-[#005461] opacity-80"
        >
          Nivel de alemán
        </label>
        <select
          id="profile-germanLevel"
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

      <div className="sm:col-span-2">
        <label
          htmlFor="profile-phone"
          className="mb-1 block text-[0.78rem] text-[#005461] opacity-80"
        >
          Teléfono (opcional)
        </label>
        <input
          type="tel"
          id="profile-phone"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className="w-full rounded-[10px] border border-[rgba(0,84,97,0.18)] px-3 py-2 text-[0.9rem] text-[#142023] outline-none transition-colors duration-200 focus:border-[#00b7b5]"
        />
      </div>

      <div className="flex items-center gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={status === "saving"}
          className="rounded-[10px] bg-[#00b7b5] px-4 py-2 text-[0.9rem] font-semibold text-[#005461] transition-colors duration-200 hover:bg-[#33cfcd] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "saving" ? "Guardando..." : "Guardar datos"}
        </button>
        {status === "success" && (
          <span className="text-[0.85rem] text-[#00b7b5]">
            Datos actualizados.
          </span>
        )}
        {status === "error" && (
          <span className="text-[0.85rem] text-red-600">
            No se pudo guardar. Revisá los datos e intentá de nuevo.
          </span>
        )}
      </div>
    </form>
  );
}
