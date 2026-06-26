"use client";

import type { Persona } from "@/data/personas";
import { SCENT_TAG_LABELS } from "@/data/scentTags";
import { SITE_COPY } from "@/data/copy";
import CopyButton from "@/components/common/CopyButton";
import type { ScentTag } from "@/lib/scoring/types";

interface ShareCardProps {
  persona: Persona;
}

function buildShareText(persona: Persona): string {
  const keywords = persona.keywords.slice(0, 3).join("、");
  const tags = persona.primaryTags
    .map((t: ScentTag) => SCENT_TAG_LABELS[t])
    .join("、");
  return `我测出来是【${persona.name}】。\n关键词：${keywords}。\n适合我的味道：${tags}。\n先测，再闻，找到你的本命香。`;
}

export default function ShareCard({ persona }: ShareCardProps) {
  const shareText = buildShareText(persona);

  return (
    <div className="card mt-6">
      <div className="rounded-xl bg-gradient-to-br from-cream-100 to-sage-400/10 p-6 text-center">
        <div className="text-sm text-sage-500">{SITE_COPY.result.shareTitle}</div>
        <h3 className="mt-2 text-2xl font-serif text-stone-800">
          {persona.name}
        </h3>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {persona.keywords.map((kw) => (
            <span
              key={kw}
              className="text-xs bg-white/60 text-sage-600 px-3 py-1 rounded-full"
            >
              {kw}
            </span>
          ))}
        </div>
        <p className="mt-4 text-sm text-stone-600 leading-relaxed">
          {persona.shareLine}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-stone-500">
          {SITE_COPY.result.shareCta}
        </span>
        <CopyButton
          text={shareText}
          label={SITE_COPY.result.copyButton}
        />
      </div>
    </div>
  );
}
