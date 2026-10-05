"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Image from "next/image";
import {
  addTestimonial,
  updateTestimonial,
} from "@/app/(admin)/admin/actions";
import { createClient } from "@/lib/supabase/client";

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const PHOTO_BUCKET = "testimonial-photos";
const PHOTO_SIZE = 256;
const PHOTO_QUALITY = 0.9;

export type TestimonialFormValues = {
  id: string;
  studentName: string;
  rating: number;
  comment: string;
  detail: string | null;
  photoUrl: string | null;
};

// Recorta al cuadrado centrado más grande, lo escala a 256×256 y lo exporta
// como JPEG. Se hace en el navegador para que la foto de un celular (EXIF de
// orientación, formatos grandes) llegue al avatar circular ya lista, sin
// perder resolución útil en la cara.
async function processTestimonialPhoto(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });

  try {
    const side = Math.min(bitmap.width, bitmap.height);
    const sx = (bitmap.width - side) / 2;
    const sy = (bitmap.height - side) / 2;

    const canvas = document.createElement("canvas");
    canvas.width = PHOTO_SIZE;
    canvas.height = PHOTO_SIZE;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("No se pudo crear el canvas.");

    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, sx, sy, side, side, 0, 0, PHOTO_SIZE, PHOTO_SIZE);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("toBlob falló."))),
        "image/jpeg",
        PHOTO_QUALITY,
      );
    });
  } finally {
    bitmap.close();
  }
}

// La subida va desde el navegador: la sesión de Gesa ya autoriza el bucket,
// y así no pasa por el límite de 1 MB de las Server Functions.
async function uploadTestimonialPhoto(photo: Blob) {
  const supabase = createClient();
  const path = `${crypto.randomUUID()}.jpg`;

  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, photo, { contentType: "image/jpeg", upsert: false });

  if (error) throw error;

  return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
}

async function removeUploadedPhoto(photoUrl: string) {
  const supabase = createClient();
  const path = photoUrl.split(`/${PHOTO_BUCKET}/`)[1];
  if (path) await supabase.storage.from(PHOTO_BUCKET).remove([path]);
}

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          aria-label={`${star} ${star === 1 ? "estrella" : "estrellas"}`}
          aria-pressed={star <= value}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-150 hover:bg-[rgba(0,183,181,0.1)]"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-6 w-6"
            fill={star <= value ? "#00b7b5" : "#d1d5db"}
          >
            <path d="M12 2.5l2.94 6.1 6.66.9-4.85 4.66 1.2 6.6L12 17.5l-5.95 3.26 1.2-6.6L2.4 9.5l6.66-.9z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

const inputClass =
  "w-full rounded-[10px] border border-[rgba(0,84,97,0.18)] px-3 py-2 text-[0.9rem] text-[#142023] outline-none transition-colors duration-200 focus:border-[#00b7b5]";
const labelClass = "mb-1 block text-[0.78rem] text-[#005461] opacity-80";

export default function TestimonialForm({
  initial,
  onDone,
  onCancel,
}: {
  initial?: TestimonialFormValues;
  onDone?: () => void;
  onCancel?: () => void;
}) {
  const isEdit = Boolean(initial);

  const [studentName, setStudentName] = useState(initial?.studentName ?? "");
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [comment, setComment] = useState(initial?.comment ?? "");
  const [detail, setDetail] = useState(initial?.detail ?? "");
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function handlePhotoChange(file: File | null) {
    setError(null);
    setPhotoBlob(null);
    setPreviewUrl(null);
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError("La foto no puede superar los 2 MB.");
      return;
    }

    setIsProcessingPhoto(true);
    try {
      const processed = await processTestimonialPhoto(file);
      setPhotoBlob(processed);
      setPreviewUrl(URL.createObjectURL(processed));
    } catch (err) {
      console.error("[admin] Error procesando la foto:", err);
      setError("No pudimos procesar esa imagen. Probá con otro archivo.");
    } finally {
      setIsProcessingPhoto(false);
    }
  }

  function resetForm() {
    setStudentName("");
    setRating(0);
    setComment("");
    setDetail("");
    setPhotoBlob(null);
    setPreviewUrl(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);

    if (rating === 0) {
      setError("Elegí una calificación de 1 a 5 estrellas.");
      return;
    }

    setIsSubmitting(true);
    let uploadedUrl: string | null = null;

    try {
      let photoUrl = initial?.photoUrl ?? null;
      if (photoBlob) {
        uploadedUrl = await uploadTestimonialPhoto(photoBlob);
        photoUrl = uploadedUrl;
      }

      const formData = new FormData();
      formData.set("studentName", studentName);
      formData.set("rating", String(rating));
      formData.set("comment", comment);
      formData.set("detail", detail);
      if (photoUrl) formData.set("photoUrl", photoUrl);

      if (initial) {
        formData.set("id", initial.id);
        await updateTestimonial(formData);
      } else {
        await addTestimonial(formData);
      }

      if (!isEdit) {
        form.reset();
        resetForm();
      }
      onDone?.();
    } catch (err) {
      console.error("[admin] Error guardando la reseña:", err);
      if (uploadedUrl) {
        await removeUploadedPhoto(uploadedUrl).catch(() => undefined);
      }
      setError("No se pudo guardar la reseña. Revisá los datos e intentá de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const shownPhoto = previewUrl ?? initial?.photoUrl ?? null;

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div>
        <label htmlFor="testimonial-name" className={labelClass}>
          Nombre del alumno
        </label>
        <input
          id="testimonial-name"
          type="text"
          required
          value={studentName}
          onChange={(event) => setStudentName(event.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <span className={labelClass}>Calificación</span>
        <StarPicker value={rating} onChange={setRating} />
      </div>

      <div className="md:col-span-2">
        <label htmlFor="testimonial-comment" className={labelClass}>
          Comentario
        </label>
        <textarea
          id="testimonial-comment"
          required
          rows={4}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          className={`${inputClass} resize-y`}
        />
      </div>

      <div>
        <label htmlFor="testimonial-detail" className={labelClass}>
          Detalle (opcional)
        </label>
        <input
          id="testimonial-detail"
          type="text"
          value={detail}
          placeholder="Nivel A2 · Clases individuales"
          onChange={(event) => setDetail(event.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="testimonial-photo" className={labelClass}>
          Foto (opcional, máx. 2 MB)
        </label>
        <div className="flex items-center gap-3">
          {shownPhoto && (
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-[#005461]">
              <Image
                src={shownPhoto}
                alt=""
                fill
                sizes="96px"
                unoptimized={shownPhoto.startsWith("blob:")}
                className="object-cover"
              />
            </div>
          )}
          <input
            id="testimonial-photo"
            type="file"
            accept="image/*"
            onChange={(event) =>
              handlePhotoChange(event.target.files?.[0] ?? null)
            }
            className="w-full text-[0.85rem] text-[#005461] file:mr-3 file:rounded-[8px] file:border-0 file:bg-[rgba(0,183,181,0.12)] file:px-3 file:py-1.5 file:font-medium file:text-[#005461]"
          />
        </div>
      </div>

      {error && (
        <p className="text-[0.85rem] text-red-600 md:col-span-2">{error}</p>
      )}

      <div className="flex flex-wrap items-center gap-2 md:col-span-2">
        <button
          type="submit"
          disabled={isSubmitting || isProcessingPhoto}
          className="rounded-[10px] bg-[#00b7b5] px-4 py-2 text-[0.9rem] font-semibold text-[#005461] transition-colors duration-200 hover:bg-[#33cfcd] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isProcessingPhoto
            ? "Procesando foto..."
            : isSubmitting
              ? "Guardando..."
            : isEdit
              ? "Guardar cambios"
              : "Agregar reseña"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-[10px] border border-[rgba(0,84,97,0.18)] px-4 py-2 text-[0.9rem] text-[#005461] transition-colors duration-200 hover:bg-[rgba(0,84,97,0.06)]"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
