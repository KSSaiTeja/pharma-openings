"use client";

import { useState } from "react";

import { avatarAccentColor, getInitials } from "@/src/lib/profileDisplay";

type UserAvatarProps = {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
  showRing?: boolean;
};

const SIZE_PX = { sm: 38, md: 48, lg: 56 } as const;

export function UserAvatar({
  name,
  src,
  size = "md",
  className = "",
  showRing = true,
}: UserAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const px = SIZE_PX[size];
  const initials = getInitials(name);
  const showImage = Boolean(src) && !imageFailed;
  const accent = avatarAccentColor(name);

  const inner = (
    <span
      className={`po-user-avatar po-user-avatar--${size}`}
      style={{
        width: px,
        height: px,
        ...(showImage
          ? undefined
          : {
              background: `linear-gradient(145deg, ${accent} 0%, #2d4a38 140%)`,
            }),
      }}
    >
      {showImage ? (
        <img
          src={src!}
          alt=""
          width={px}
          height={px}
          className="po-user-avatar__img"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className="po-user-avatar__initials">{initials}</span>
      )}
    </span>
  );

  if (!showRing) {
    return (
      <span className={`po-user-avatar-standalone${className ? ` ${className}` : ""}`}>{inner}</span>
    );
  }

  return (
    <span
      className={`po-user-avatar-wrap po-user-avatar-wrap--${size}${className ? ` ${className}` : ""}`}
      aria-hidden={showImage ? undefined : true}
    >
      {inner}
    </span>
  );
}
