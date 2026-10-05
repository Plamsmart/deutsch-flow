"use client";

import { useState } from "react";
import Image from "next/image";
import StarRating from "@/components/StarRating";
import { deleteTestimonial } from "@/app/(admin)/admin/actions";
import TestimonialForm, { type TestimonialFormValues } from "./TestimonialForm";

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

export default function TestimonialItem({
  testimonial,
}: {
  testimonial: TestimonialFormValues;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete() {
    if (
      !window.confirm(
        "¿Seguro que querés eliminar esta reseña? Esta acción no se puede deshacer.",
      )
    ) {
      return;
    }

    setDeleteError(null);
    setIsDeleting(true);

    const formData = new FormData();
    formData.set("id", testimonial.id);

    try {
      await deleteTestimonial(formData);
    } catch (err) {
      console.error("[admin] Error eliminando la reseña:", err);
      setDeleteError("No se pudo eliminar la reseña. Intentá de nuevo.");
      setIsDeleting(false);
    }
  }

  if (isEditing) {
    return (
      <div className="rounded-[16px] border border-[rgba(0,84,97,0.1)] bg-white p-6 shadow-[0_6px_20px_rgba(0,84,97,0.06)]">
        <TestimonialForm
          initial={testimonial}
          onDone={() => setIsEditing(false)}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-[16px] border border-[rgba(0,84,97,0.1)] bg-white p-6 shadow-[0_6px_20px_rgba(0,84,97,0.06)] md:flex-row md:items-start">
      <div className="flex items-center gap-4 md:w-[260px] md:shrink-0">
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#005461] font-[family-name:var(--font-fraunces)] text-[1rem] text-[#f4f4f4]">
          {testimonial.photoUrl ? (
            <Image
              src={testimonial.photoUrl}
              alt=""
              fill
              sizes="48px"
              className="object-cover"
            />
          ) : (
            getInitials(testimonial.studentName)
          )}
        </div>
        <div>
          <div className="font-medium text-[#005461]">
            {testimonial.studentName}
          </div>
          {testimonial.detail && (
            <div className="text-[0.78rem] text-[#018790] opacity-80">
              {testimonial.detail}
            </div>
          )}
          <StarRating
            rating={testimonial.rating}
            ariaLabel={`${testimonial.rating} de 5 estrellas`}
            className="mt-1"
          />
        </div>
      </div>

      <div className="flex-1 text-[0.92rem] leading-[1.6] text-[#142023]">
        {testimonial.comment}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            disabled={isDeleting}
            className="rounded-[8px] border border-[rgba(0,84,97,0.18)] px-3 py-1.5 text-[0.78rem] text-[#005461] transition-colors duration-200 hover:bg-[rgba(0,84,97,0.06)] disabled:opacity-60"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-[8px] border border-[rgba(220,38,38,0.3)] px-3 py-1.5 text-[0.78rem] font-medium text-red-600 transition-colors duration-200 hover:bg-[rgba(220,38,38,0.08)] disabled:opacity-60"
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
        {deleteError && (
          <p className="max-w-[220px] text-right text-[0.75rem] text-red-600">
            {deleteError}
          </p>
        )}
      </div>
    </div>
  );
}
