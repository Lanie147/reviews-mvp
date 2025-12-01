"use client";

import { type PropsWithChildren } from "react";
import { useSelectedLayoutSegments } from "next/navigation";

/** Hides its children when the first URL segment is "r" (i.e. /r/[slug]) */
export default function HideOnLanding({ children }: PropsWithChildren) {
  const segments = useSelectedLayoutSegments();
  const first = segments[0] ?? "";
  if (first !== "dashboard") return null;
  return <>{children}</>;
}
