import type { CSSProperties } from "react";

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace("#", "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/**
 * CMS color fields often use Tailwind arbitrary values (e.g. text-[#4641D9]).
 * Those are not generated unless the exact class appears in source, so resolve
 * hex-based classes to inline styles. Other classes (e.g. dark: variants) stay as className.
 */
export function resolveBrandColorClasses(
  colorClass?: string,
  bgClass?: string
): { className: string; style: CSSProperties } {
  const classes: string[] = [];
  const style: CSSProperties = {};

  const textHex = colorClass?.match(/text-\[(#[0-9A-Fa-f]{3,8})\]/)?.[1];
  if (textHex) {
    style.color = textHex;
  } else if (colorClass) {
    classes.push(colorClass);
  }

  const bgMatch = bgClass?.match(/bg-\[(#[0-9A-Fa-f]{3,8})\](?:\/(\d+))?/);
  if (bgMatch) {
    const alpha = bgMatch[2] ? Number(bgMatch[2]) / 100 : 1;
    style.backgroundColor = hexToRgba(bgMatch[1], alpha);
  } else if (bgClass) {
    classes.push(bgClass);
  }

  return { className: classes.join(" "), style };
}
