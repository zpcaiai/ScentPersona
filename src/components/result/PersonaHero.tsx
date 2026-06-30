import type { Persona } from "@/data/personas";
import { getLocale } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/config";

interface PersonaHeroProps {
  persona: Persona;
  confidence: number;
}

export default function PersonaHero({ persona, confidence }: PersonaHeroProps) {
  const locale = getLocale();
  return (
    <div className="text-center py-8">
      <div className="text-sm text-sage-500 mb-2">
        {pick(locale, "你的气味人格是", "Your scent persona is")}
      </div>
      <h1 className="text-3xl font-serif text-stone-800">{persona.name}</h1>
      <p className="mt-2 text-stone-600">{persona.title}</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {persona.keywords.map((kw) => (
          <span
            key={kw}
            className="text-xs bg-cream-100 text-sage-600 px-3 py-1 rounded-full"
          >
            {kw}
          </span>
        ))}
      </div>
      <div className="mt-3 text-xs text-stone-400">
        {pick(locale, "匹配度", "Match")} {Math.round(confidence * 100)}%
      </div>
    </div>
  );
}
