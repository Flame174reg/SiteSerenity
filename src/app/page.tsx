import Link from "next/link";
import { getSiteContent } from "@/lib/contentStore";

export const revalidate = 0;

export default async function Home() {
  const { home } = await getSiteContent();

  return (
    <main className="min-h-[calc(100vh-56px)] grid place-items-center px-6">
      <section className="w-full max-w-4xl text-center space-y-6">
        <div className="card-soft p-10">
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
            {home.heroTitle}
          </h1>
          <p className="mt-3 text-lg muted">{home.heroSubtitle}</p>

          <div className="mt-6 flex justify-center gap-3 flex-wrap">
            <Link href={home.primaryCtaHref || "/weekly"} className="btn">
              {home.primaryCtaLabel}
            </Link>
            <Link href={home.secondaryCtaHref || "/contracts"} className="btn-ghost">
              {home.secondaryCtaLabel}
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {home.featureCards.slice(0, 6).map((card) => (
            <div key={card.id} className="card text-left">
              <div className="text-sm muted">{card.title}</div>
              <div className="mt-2 font-semibold">{card.description}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
