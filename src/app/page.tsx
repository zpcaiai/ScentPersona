import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import { getSiteCopy } from "@/data/copy";
import { getPersonas } from "@/data/personas";
import TrackEvent from "@/components/common/TrackEvent";
import { getLocale } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/config";
import ExploreSection from "@/components/home/ExploreSection";

const previewPersonas = ["rain-study", "warm-sweater", "white-shirt-morning", "olive-rest"];

export default function LandingPage() {
  const locale = getLocale();
  const copy = getSiteCopy(locale);
  const personas = getPersonas(locale);

  return (
    <PageShell>
      <TrackEvent eventName="page_view" path="/" />
      {/* Hero */}
      <section className="text-center py-12">
        <h1 className="text-3xl font-serif text-stone-800 leading-tight">
          {copy.landing.heroTitle}
        </h1>
        <p className="mt-4 text-stone-600 leading-relaxed">
          {copy.landing.heroSubtitle}
        </p>
        <div className="mt-8 flex flex-col gap-3 items-center">
          <Link href="/quiz" className="btn-primary w-48">
            {copy.landing.heroCtaPrimary}
          </Link>
          <Link href="/products" className="btn-secondary w-48">
            {copy.landing.heroCtaSecondary}
          </Link>
        </div>
      </section>

      {/* Problem */}
      <section className="py-8">
        <h2 className="text-xl font-serif text-stone-700 text-center mb-6">
          {copy.landing.problemTitle}
        </h2>
        <div className="grid gap-3">
          {copy.landing.problemPoints.map((point, i) => (
            <div key={i} className="card flex items-center gap-3">
              <span className="text-sage-500 text-lg">·</span>
              <span className="text-stone-600">{point}</span>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-8">
        <h2 className="text-xl font-serif text-stone-700 text-center mb-6">
          {copy.landing.howItWorksTitle}
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {copy.landing.steps.map((step, i) => (
            <div key={i} className="card text-center">
              <div className="text-sage-500 text-sm mb-1">Step {i + 1}</div>
              <div className="font-serif text-stone-800">{step.title}</div>
              <div className="text-sm text-stone-500 mt-1">{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Explore: scent families + featured topics (DB-backed) */}
      <ExploreSection />

      {/* Persona preview */}
      <section className="py-8">
        <h2 className="text-xl font-serif text-stone-700 text-center mb-6">
          {pick(locale, "你可能是哪种气味人格？", "Which scent persona might you be?")}
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {personas.filter((p) => previewPersonas.includes(p.id)).map((persona) => (
            <Link
              key={persona.id}
              href="/quiz"
              className="card hover:border-sage-400 transition-colors"
            >
              <div className="font-serif text-stone-800">{persona.name}</div>
              <div className="text-xs text-stone-500 mt-1">{persona.title}</div>
              <div className="flex flex-wrap gap-1 mt-2">
                {persona.keywords.slice(0, 3).map((kw) => (
                  <span key={kw} className="text-xs bg-cream-100 text-sage-600 px-2 py-0.5 rounded-full">
                    {kw}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Product preview */}
      <section className="py-8">
        <h2 className="text-xl font-serif text-stone-700 text-center mb-6">
          {pick(locale, "先试三支，再选本命", "Try three first, then choose your signature")}
        </h2>
        <div className="card text-center">
          <div className="font-serif text-lg text-stone-800">
            {copy.products.primaryOfferTitle}
          </div>
          <div className="text-sm text-stone-500 mt-2">
            {copy.products.primaryOfferDesc}
          </div>
          <div className="text-2xl font-serif text-clay-500 mt-3">
            {copy.products.primaryOfferPrice}
          </div>
          <Link href="/quiz" className="btn-primary mt-4 inline-flex">
            {copy.landing.heroCtaPrimary}
          </Link>
        </div>
      </section>

      {/* Trust */}
      <section className="py-8">
        <h2 className="text-xl font-serif text-stone-700 text-center mb-6">
          {copy.landing.trustTitle}
        </h2>
        <div className="grid gap-3">
          {copy.landing.trustPoints.map((point, i) => (
            <div key={i} className="flex items-center gap-3 text-stone-600">
              <span className="text-sage-500">✓</span>
              <span>{point}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="text-center py-12">
        <h2 className="text-2xl font-serif text-stone-800">
          {copy.landing.finalCtaTitle}
        </h2>
        <Link href="/quiz" className="btn-primary mt-6 inline-flex w-48">
          {copy.landing.finalCtaButton}
        </Link>
      </section>
    </PageShell>
  );
}
