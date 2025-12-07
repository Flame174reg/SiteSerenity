"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FeatureCard, SiteContent } from "@/lib/contentStore";

type ContentResp =
  | { ok: true; content: SiteContent }
  | { ok: false; error: string };

function emptyFeatureCard(): FeatureCard {
  return {
    id: `feature-${Date.now()}`,
    title: "",
    description: "",
  };
}

function htmlToText(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent || div.innerText || "").trim();
}

export default function SiteContentEditor() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [baseline, setBaseline] = useState<SiteContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [subtitleHtml, setSubtitleHtml] = useState<string>("");

  const subtitleRef = useRef<HTMLDivElement | null>(null);

  const inputClass = "w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 outline-none";
  const textareaClass = `${inputClass} min-h-[90px]`;
  const canAddFeature = (content?.home.featureCards.length ?? 0) < 8;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        const r = await fetch("/api/admin/content", { cache: "no-store" });
        const j = (await r.json().catch(() => null)) as ContentResp | null;
        if (!r.ok || !j || !("ok" in j) || !j.ok) {
          const msg = j && "error" in j ? j.error : r.statusText;
          throw new Error(msg || "Не удалось загрузить данные");
        }
        if (!cancelled) {
          setContent(j.content);
          setBaseline(j.content);
          setSubtitleHtml(j.content.home.heroSubtitleHtml || j.content.home.heroSubtitle || "");
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasChanges = useMemo(() => {
    if (!content || !baseline) return false;
    return JSON.stringify(content) !== JSON.stringify(baseline);
  }, [content, baseline]);

  function updateHome<K extends keyof SiteContent["home"]>(key: K, value: SiteContent["home"][K]) {
    if (!content) return;
    setContent({
      ...content,
      home: {
        ...content.home,
        [key]: value,
      },
    });
  }

  function updateSubtitle(html: string) {
    if (!content) return;
    setSubtitleHtml(html);
    updateHome("heroSubtitleHtml", html);
    updateHome("heroSubtitle", htmlToText(html));
  }

  function updateFeature(id: string, patch: Partial<FeatureCard>) {
    if (!content) return;
    setContent({
      ...content,
      home: {
        ...content.home,
        featureCards: content.home.featureCards.map((f) =>
          f.id === id ? { ...f, ...patch } : f
        ),
      },
    });
  }

  function addFeature() {
    if (!content) return;
    setContent({
      ...content,
      home: {
        ...content.home,
        featureCards: [...content.home.featureCards, emptyFeatureCard()],
      },
    });
  }

  function removeFeature(id: string) {
    if (!content) return;
    setContent({
      ...content,
      home: {
        ...content.home,
        featureCards: content.home.featureCards.filter((f) => f.id !== id),
      },
    });
  }

  function exec(cmd: string, value?: string) {
    if (!subtitleRef.current) return;
    subtitleRef.current.focus();
    document.execCommand(cmd, false, value);
    updateSubtitle(subtitleRef.current.innerHTML);
  }

  function insertLink() {
    const url = prompt("Вставьте ссылку (https://...)");
    if (!url) return;
    exec("createLink", url);
  }

  function insertImage() {
    const url = prompt("Вставьте URL изображения");
    if (!url) return;
    exec("insertImage", url);
  }

  async function save() {
    if (!content) return;
    setSaving(true);
    setInfo(null);
    setError(null);
    try {
      const r = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const j = (await r.json().catch(() => null)) as ContentResp | null;
      if (!r.ok || !j || !("ok" in j) || !j.ok) {
        const msg = j && "error" in j ? j.error : r.statusText;
        throw new Error(msg || "Не удалось сохранить");
      }
      setContent(j.content);
      setBaseline(j.content);
      setSubtitleHtml(j.content.home.heroSubtitleHtml || "");
      setInfo("Сохранено");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Редактор контента</h2>
          <p className="text-sm opacity-70">
            Тексты главной страницы можно менять прямо здесь. Изменения применяются сразу после сохранения.
          </p>
          {content?.updatedAt && (
            <p className="text-xs opacity-60 mt-1">
              Обновлено: {new Date(content.updatedAt).toLocaleString("ru-RU")}{" "}
              {content.updatedBy ? `· ${content.updatedBy}` : ""}
            </p>
          )}
        </div>
        <button className="btn" onClick={save} disabled={!content || saving || !hasChanges}>
          {saving ? "Сохранение..." : "Сохранить"}
        </button>
      </div>

      {loading && <div className="opacity-70 text-sm">Загрузка данных…</div>}
      {error && <div className="text-sm text-red-300">{error}</div>}
      {info && <div className="text-sm text-emerald-300">{info}</div>}

      {content && !loading && (
        <div className="space-y-6">
          <section className="grid gap-4">
            <h3 className="text-lg font-semibold">Хиро-блок</h3>
            <label className="grid gap-1 text-sm">
              <span className="opacity-80">Заголовок</span>
              <input
                className={inputClass}
                value={content.home.heroTitle}
                onChange={(e) => updateHome("heroTitle", e.target.value)}
              />
            </label>

            <div className="grid gap-2 text-sm">
              <span className="opacity-80">Подзаголовок (rich text)</span>
              <div className="flex flex-wrap gap-1">
                <button className="btn-ghost text-xs" type="button" onClick={() => exec("bold")}>
                  B
                </button>
                <button className="btn-ghost text-xs" type="button" onClick={() => exec("italic")}>
                  I
                </button>
                <button className="btn-ghost text-xs" type="button" onClick={() => exec("underline")}>
                  U
                </button>
                <button className="btn-ghost text-xs" type="button" onClick={() => exec("justifyLeft")}>
                  ⬅
                </button>
                <button className="btn-ghost text-xs" type="button" onClick={() => exec("justifyCenter")}>
                  ⬌
                </button>
                <button className="btn-ghost text-xs" type="button" onClick={() => exec("justifyRight")}>
                  ➡
                </button>
                <button className="btn-ghost text-xs" type="button" onClick={insertLink}>
                  Ссылка
                </button>
                <button className="btn-ghost text-xs" type="button" onClick={insertImage}>
                  Картинка
                </button>
              </div>
              <div
                ref={subtitleRef}
                className="min-h-[140px] rounded-md border border-white/20 bg-white/5 p-3 text-sm focus:outline-none"
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => updateSubtitle((e.currentTarget as HTMLDivElement).innerHTML)}
                dangerouslySetInnerHTML={{ __html: subtitleHtml }}
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-sm">
                <span className="opacity-80">Кнопка 1 — текст</span>
                <input
                  className={inputClass}
                  value={content.home.primaryCtaLabel}
                  onChange={(e) => updateHome("primaryCtaLabel", e.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="opacity-80">Кнопка 1 — ссылка</span>
                <input
                  className={inputClass}
                  value={content.home.primaryCtaHref}
                  onChange={(e) => updateHome("primaryCtaHref", e.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="opacity-80">Кнопка 2 — текст</span>
                <input
                  className={inputClass}
                  value={content.home.secondaryCtaLabel}
                  onChange={(e) => updateHome("secondaryCtaLabel", e.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="opacity-80">Кнопка 2 — ссылка</span>
                <input
                  className={inputClass}
                  value={content.home.secondaryCtaHref}
                  onChange={(e) => updateHome("secondaryCtaHref", e.target.value)}
                />
              </label>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Карточки преимуществ</h3>
                <p className="text-sm opacity-70">Добавляйте или обновляйте текст карточек на главной.</p>
              </div>
              <button className="btn-ghost text-sm disabled:opacity-50" onClick={addFeature} disabled={!canAddFeature}>
                + Добавить
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {content.home.featureCards.map((card) => (
                <div key={card.id} className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
                  <label className="grid gap-1 text-sm">
                    <span className="opacity-80">Заголовок</span>
                    <input
                      className={inputClass}
                      value={card.title}
                      onChange={(e) => updateFeature(card.id, { title: e.target.value })}
                    />
                  </label>
                  <label className="grid gap-1 text-sm">
                    <span className="opacity-80">Описание</span>
                    <textarea
                      className={`${textareaClass} min-h-[80px]`}
                      value={card.description}
                      onChange={(e) => updateFeature(card.id, { description: e.target.value })}
                    />
                  </label>
                  {content.home.featureCards.length > 1 && (
                    <div className="flex justify-end">
                      <button className="text-xs text-red-300 hover:text-red-200" onClick={() => removeFeature(card.id)}>
                        Удалить
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
