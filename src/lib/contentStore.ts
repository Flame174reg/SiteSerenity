import { list, put } from "@vercel/blob";

export type FeatureCard = {
  id: string;
  title: string;
  description: string;
};

export type HomeContent = {
  heroTitle: string;
  heroSubtitle: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  featureCards: FeatureCard[];
};

export type SiteContent = {
  home: HomeContent;
  updatedAt?: string;
  updatedBy?: string;
};

const CONTENT_PATH = "content/site.json";
const token = process.env.BLOB_READ_WRITE_TOKEN;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function asString(v: unknown, fallback = ""): string {
  if (typeof v === "string") return v.slice(0, 4000);
  if (typeof v === "number" || typeof v === "boolean") return String(v).slice(0, 4000);
  return fallback;
}

function fallbackContent(): SiteContent {
  return {
    home: {
      heroTitle: "Site Serenity",
      heroSubtitle:
        "öç?çü?‘<ü õ?‘?‘'ø> ¢?\" ????‘?‘'ñ, õø?‘?‘'óñ ñ çç?ç?ç>‘??ñó ? ????? øóó‘?‘?ø‘'??? ?ç‘?‘'ç.",
      primaryCtaLabel: "ç?ç?ç>‘??ñó",
      primaryCtaHref: "/weekly",
      secondaryCtaLabel: "\"?ó‘??ç?‘'‘<",
      secondaryCtaHref: "/contracts",
      featureCards: [
        {
          id: "feature-1",
          title: "'‘<‘?‘'‘?‘<ü ??‘?‘'‘?õ",
          description: "?ø?‘?‘'óñ",
        },
        {
          id: "feature-2",
          title: "?õ‘?ø?>ç?ñç",
          description: "???ñ?-õø?ç>‘?",
        },
        {
          id: "feature-3",
          title: "?‘??‘\"ñ>‘?",
          description: ">ñ‘Ø?‘<ü óø+ñ?ç‘'",
        },
      ],
    },
  };
}

function normalizeFeatureCard(v: unknown, idx: number): FeatureCard {
  const rec = isRecord(v) ? v : {};
  const id = asString(rec.id, "").trim() || `feature-${idx + 1}`;
  return {
    id,
    title: asString(rec.title, "").trim(),
    description: asString(rec.description, "").trim(),
  };
}

export function normalizeSiteContent(raw: unknown): SiteContent {
  const fallback = fallbackContent();
  const rec = isRecord(raw) ? raw : {};
  const home = isRecord(rec.home) ? rec.home : {};
  const featureCardsRaw = Array.isArray((home as Record<string, unknown>).featureCards)
    ? ((home as Record<string, unknown>).featureCards as unknown[])
    : [];

  const normalizedFeatures = featureCardsRaw
    .slice(0, 8)
    .map((item, idx) => normalizeFeatureCard(item, idx))
    .filter((card) => card.title || card.description);

  const fallbackFeatures =
    normalizedFeatures.length > 0
      ? normalizedFeatures
      : fallback.home.featureCards.map((item, idx) => ({ ...item, id: `feature-${idx + 1}` }));

  const homeNormalized: HomeContent = {
    heroTitle: asString(home.heroTitle, fallback.home.heroTitle).trim(),
    heroSubtitle: asString(home.heroSubtitle, fallback.home.heroSubtitle).trim(),
    primaryCtaLabel: asString(home.primaryCtaLabel, fallback.home.primaryCtaLabel).trim(),
    primaryCtaHref: asString(home.primaryCtaHref, fallback.home.primaryCtaHref).trim() || "/weekly",
    secondaryCtaLabel: asString(home.secondaryCtaLabel, fallback.home.secondaryCtaLabel).trim(),
    secondaryCtaHref: asString(home.secondaryCtaHref, fallback.home.secondaryCtaHref).trim() || "/contracts",
    featureCards: fallbackFeatures,
  };

  const updatedAt = asString(rec.updatedAt, "").trim();
  const updatedBy = asString(rec.updatedBy, "").trim();

  return {
    home: homeNormalized,
    updatedAt: updatedAt || undefined,
    updatedBy: updatedBy || undefined,
  };
}

async function readBlobJson(): Promise<SiteContent | null> {
  if (!token) return null;
  try {
    const { blobs } = await list({ prefix: CONTENT_PATH, token });
    const blob = blobs.find((b) => b.pathname === CONTENT_PATH);
    if (!blob) return null;

    const res = await fetch(blob.url, { cache: "no-store" });
    if (!res.ok) return null;

    const json = (await res.json()) as unknown;
    return normalizeSiteContent(json);
  } catch {
    return null;
  }
}

export async function getSiteContent(): Promise<SiteContent> {
  const fromBlob = await readBlobJson();
  return fromBlob ?? fallbackContent();
}

export async function saveSiteContent(content: SiteContent, updatedBy?: string): Promise<SiteContent> {
  if (!token) throw new Error("BLOB_READ_WRITE_TOKEN is missing");

  const normalized = normalizeSiteContent(content);
  const toStore: SiteContent = {
    ...normalized,
    updatedAt: new Date().toISOString(),
    updatedBy: updatedBy || normalized.updatedBy,
  };

  await put(CONTENT_PATH, JSON.stringify(toStore, null, 2), {
    access: "public",
    token,
    contentType: "application/json",
  });

  return toStore;
}
