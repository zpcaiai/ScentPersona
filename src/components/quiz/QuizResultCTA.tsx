"use client";

import Link from "next/link";
import { SITE_COPY } from "@/data/copy";

interface QuizResultCTAProps {
  sessionId: string;
}

export default function QuizResultCTA({ sessionId }: QuizResultCTAProps) {
  return (
    <div className="card mt-6 text-center bg-gradient-to-br from-sage-400/10 to-cream-100">
      <h3 className="font-serif text-lg text-stone-800">
        {SITE_COPY.result.sampleCtaTitle}
      </h3>
      <p className="mt-2 text-sm text-stone-600">
        {SITE_COPY.result.sampleCtaCopy}
      </p>
      <Link
        href={`/checkout?sessionId=${sessionId}`}
        className="btn-primary mt-4 inline-flex"
      >
        {SITE_COPY.result.sampleCtaButton}
      </Link>
    </div>
  );
}
