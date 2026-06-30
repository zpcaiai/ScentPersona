import type { Persona } from "@/data/personas";
import { getScentTagLabels, getScentTagDescriptions } from "@/data/scentTags";
import { getLocale } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/config";
import type { ScentTag } from "@/lib/scoring/types";

interface ScentProfileCardProps {
  persona: Persona;
}

export default function ScentProfileCard({ persona }: ScentProfileCardProps) {
  const locale = getLocale();
  const labels = getScentTagLabels(locale);
  const descriptions = getScentTagDescriptions(locale);

  return (
    <div className="card mt-6">
      <h3 className="font-serif text-lg text-stone-800">
        {pick(locale, "你适合的味道", "Scents that suit you")}
      </h3>
      <p className="mt-2 text-sm text-stone-600 leading-relaxed">
        {persona.reportSections.scentDirection}
      </p>
      <div className="mt-4 grid gap-2">
        {persona.primaryTags.map((tag: ScentTag) => (
          <div key={tag} className="flex items-start gap-2">
            <span className="text-xs bg-sage-400/20 text-sage-600 px-2 py-0.5 rounded-full whitespace-nowrap">
              {labels[tag]}
            </span>
            <span className="text-sm text-stone-500">
              {descriptions[tag]}
            </span>
          </div>
        ))}
      </div>

      <h3 className="font-serif text-lg text-stone-800 mt-6">
        {pick(locale, "你可以避开的味道", "Scents you can skip")}
      </h3>
      <p className="mt-2 text-sm text-stone-600 leading-relaxed">
        {persona.reportSections.avoid}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {persona.avoidTags.map((tag: ScentTag) => (
          <span
            key={tag}
            className="text-xs bg-stone-100 text-stone-400 px-2 py-0.5 rounded-full"
          >
            {labels[tag]}
          </span>
        ))}
      </div>
    </div>
  );
}
