import Link from "next/link";
import Image from "next/image";
import { getSiteContent } from "@/lib/contentStore";

export const revalidate = 0;

export default async function Home() {
  const { home } = await getSiteContent();

  return (
    <main className="min-h-[calc(100vh-56px)] px-6 py-10">
      <section className="mx-auto max-w-5xl space-y-10">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 md:p-12 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-[rgba(124,58,237,0.18)] via-transparent to-[rgba(37,99,235,0.14)]" />
          <div className="relative flex flex-col gap-4 text-left">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-white/10 border border-white/15 grid place-items-center overflow-hidden">
                <Image
                  src="/logo.svg"
                  alt="Site logo"
                  width={48}
                  height={48}
                  className="h-12 w-12 object-contain"
                  priority
                />
              </div>
              <span className="pill w-fit">Serenity Seattle · community</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight drop-shadow">
              {home.heroTitle}
            </h1>
            {home.heroSubtitleHtml ? (
              <div
                className="text-lg text-white/80 max-w-3xl space-y-2"
                dangerouslySetInnerHTML={{ __html: home.heroSubtitleHtml }}
              />
            ) : (
              <p className="text-lg text-white/80 max-w-3xl">{home.heroSubtitle}</p>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              <Link href={home.primaryCtaHref || "/weekly"} className="btn">
                {home.primaryCtaLabel || "Недельный актив"}
              </Link>
              <Link href={home.secondaryCtaHref || "/rules"} className="btn-ghost">
                {home.secondaryCtaLabel || "Правила семьи"}
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {home.featureCards.slice(0, 6).map((card, idx) => (
            <div key={card.id || idx} className="card text-left p-5 backdrop-blur-sm">
              <div className="text-xs uppercase tracking-[0.12em] text-white/60">0{idx + 1}</div>
              <div className="mt-2 text-lg font-semibold text-white">{card.title}</div>
              <div className="mt-1 text-sm text-white/70 leading-relaxed">{card.description}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
