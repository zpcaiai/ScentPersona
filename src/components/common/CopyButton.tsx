"use client";

import { useState } from "react";
import { useLang } from "@/lib/i18n/LangProvider";
import { getSiteCopy } from "@/data/copy";

interface CopyButtonProps {
  text: string;
  label?: string;
}

export default function CopyButton({ text, label }: CopyButtonProps) {
  const { locale } = useLang();
  const common = getSiteCopy(locale).common;
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for mobile
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="btn-secondary text-sm"
    >
      {copied ? common.copied : label ?? common.copy}
    </button>
  );
}
