// src/components/CopyButton.tsx
"use client";

import { useState } from "react";

export function CopyButton({
  text,
  children,
  className,
}: {
  text: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  }

  return (
    <button onClick={onCopy} type="button" className={className}>
      {copied ? "Copied!" : children}
    </button>
  );
}
