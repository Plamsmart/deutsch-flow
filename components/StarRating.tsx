const STAR_PATH =
  "M12 2.5l2.94 6.1 6.66.9-4.85 4.66 1.2 6.6L12 17.5l-5.95 3.26 1.2-6.6L2.4 9.5l6.66-.9z";

export default function StarRating({
  rating,
  ariaLabel,
  className = "",
}: {
  rating: number;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div role="img" aria-label={ariaLabel} className={`flex gap-[0.2rem] ${className}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill={i < rating ? "#00b7b5" : "#d1d5db"}
        >
          <path d={STAR_PATH} />
        </svg>
      ))}
    </div>
  );
}
