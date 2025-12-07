import { list, put } from "@vercel/blob";
import sanitizeHtml from "sanitize-html";

export type FeatureCard = {
  id: string;
  title: string;
  description: string;
};

export type HomeContent = {
  heroTitle: string;
  heroSubtitle: string;
  heroSubtitleHtml?: string;
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

function cleanText(v: unknown, fallback = ""): string {
  const base =
    typeof v === "string"
      ? v
      : typeof v === "number" || typeof v === "boolean"
      ? String(v)
      : "";

  const trimmed = base.trim();
  if (!trimmed) return fallback;

  const withoutCtrl = trimmed.replace(/[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g, "");

  const badChars = (withoutCtrl.match(/\uFFFD/g) || []).length;
  const ratioBad = withoutCtrl.length > 0 ? badChars / withoutCtrl.length : 0;
  if (ratioBad > 0.1) return fallback;

  const mojibakeMatches =
    withoutCtrl.match(/[ÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ]/g) || [];
  const ratioMojibake = withoutCtrl.length > 0 ? mojibakeMatches.length / withoutCtrl.length : 0;
  if (ratioMojibake > 0.2) return fallback;

  const allowed = withoutCtrl.match(/[A-Za-zА-Яа-я0-9.,;:!?"'()\-–—\s]/g) || [];
  const ratioAllowed = withoutCtrl.length > 0 ? allowed.length / withoutCtrl.length : 0;
  if (ratioAllowed < 0.4) return fallback;

  return withoutCtrl.slice(0, 4000);
}

function cleanHtml(html: unknown, fallback = ""): string {
  if (typeof html !== "string") return fallback;
  const sanitized = sanitizeHtml(html, {
    allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "a", "div", "span", "img"],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt"],
      "*": ["style"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }),
    },
    parser: { lowerCaseTags: true },
  }).trim();
  return sanitized || fallback;
}

function fallbackContent(): SiteContent {
  const subtitle =
    "Командная витрина: загружайте контент, ведите правила и управляйте доступами в одном месте.";
  return {
    home: {
      heroTitle: "Serenity Seattle",
      heroSubtitle: subtitle,
      heroSubtitleHtml: `<p>${subtitle}</p>`,
      primaryCtaLabel: "Недельный актив",
      primaryCtaHref: "/weekly",
      secondaryCtaLabel: "Правила семьи",
      secondaryCtaHref: "/rules",
      featureCards: [
        {
          id: "feature-1",
          title: "Быстрые обновления",
          description: "Загружайте фото и тексты без dev-развертки.",
        },
        {
          id: "feature-2",
          title: "Роли и доступы",
          description: "Гибкие права для админов и суперадминов.",
        },
        {
          id: "feature-3",
          title: "Данные под рукой",
          description: "Файлы, правила и заметки — в одном месте.",
        },
      ],
    },
  };
}

function normalizeFeatureCard(v: unknown, idx: number): FeatureCard {
  const rec = isRecord(v) ? v : {};
  const id = cleanText(rec.id, "").trim() || `feature-${idx + 1}`;
  return {
    id,
    title: cleanText(rec.title, "").trim(),
    description: cleanText(rec.description, "").trim(),
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
    heroTitle: cleanText(home.heroTitle, fallback.home.heroTitle).trim(),
    heroSubtitle: cleanText(home.heroSubtitle, fallback.home.heroSubtitle).trim(),
    heroSubtitleHtml: cleanHtml(
      home.heroSubtitleHtml,
      fallback.home.heroSubtitleHtml || fallback.home.heroSubtitle
    ),
    primaryCtaLabel: cleanText(home.primaryCtaLabel, fallback.home.primaryCtaLabel).trim(),
    primaryCtaHref: cleanText(home.primaryCtaHref, fallback.home.primaryCtaHref).trim() || "/weekly",
    secondaryCtaLabel: cleanText(home.secondaryCtaLabel, fallback.home.secondaryCtaLabel).trim(),
    secondaryCtaHref: cleanText(home.secondaryCtaHref, fallback.home.secondaryCtaHref).trim() || "/rules",
    featureCards: fallbackFeatures,
  };

  const updatedAt = cleanText(rec.updatedAt, "").trim();
  const updatedBy = cleanText(rec.updatedBy, "").trim();

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
    allowOverwrite: true,
  });

  return toStore;
}
