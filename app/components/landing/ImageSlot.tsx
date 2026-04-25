import Image from "next/image";

import {
  type FeatureImageKey,
  LANDING_MEDIA_PATHS,
} from "./content";

type ImageSlotProps = {
  imageKey: FeatureImageKey;
  alt: string;
  className?: string;
};

/**
 * Renders a hero asset when `LANDING_MEDIA_PATHS[imageKey]` is set; otherwise
 * a reserved frame matching the reference layout for client-provided images.
 */
export function ImageSlot({ imageKey, alt, className = "" }: ImageSlotProps) {
  const src = LANDING_MEDIA_PATHS[imageKey];

  if (src) {
    return (
      <div
        className={`relative w-full overflow-hidden rounded-[1.25rem] bg-[#ece8f4] ${className}`}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover object-center"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority={imageKey === "compliance"}
        />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={alt}
      className={`flex w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-[1.25rem] border border-dashed border-[#c4bdd9]/80 bg-linear-to-br from-[#f3f0fc] to-[#e8e2f6] px-6 text-center ${className}`}
    >
      <span className="rounded-full bg-white/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6d6ae8]/90">
        Your visual
      </span>
      <p className="max-w-[14rem] text-xs leading-relaxed text-[#6b6880]">
        Wire this slot in{" "}
        <span className="font-mono text-[11px] text-[#1e1b36]/80">
          LANDING_MEDIA_PATHS.{imageKey}
        </span>
      </p>
    </div>
  );
}
