import type { Persona } from "@/data/personas";
import { SCENT_TAG_LABELS, SCENT_TAG_DESCRIPTIONS } from "@/data/scentTags";
import type { ScentTag } from "@/lib/scoring/types";

interface ScentProfileCardProps {
  persona: Persona;
}

export default function ScentProfileCard({ persona }: ScentProfileCardProps) {
  return (
    <div className="card mt-6">
      <h3 className="font-serif text-lg text-stone-800">你适合的味道</h3>
      <p className="mt-2 text-sm text-stone-600 leading-relaxed">
        {persona.reportSections.scentDirection}
      </p>
      <div className="mt-4 grid gap-2">
        {persona.primaryTags.map((tag: ScentTag) => (
          <div key={tag} className="flex items-start gap-2">
            <span className="text-xs bg-sage-400/20 text-sage-600 px-2 py-0.5 rounded-full whitespace-nowrap">
              {SCENT_TAG_LABELS[tag]}
            </span>
            <span className="text-sm text-stone-500">
              {SCENT_TAG_DESCRIPTIONS[tag]}
            </span>
          </div>
        ))}
      </div>

      <h3 className="font-serif text-lg text-stone-800 mt-6">
        你可以避开的味道
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
            {SCENT_TAG_LABELS[tag]}
          </span>
        ))}
      </div>
    </div>
  );
}
