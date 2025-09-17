// src/app/weekly/upload.client.tsx
"use client";

import { useState, useRef } from "react";

type Props = {
  defaultCategory?: string;
  categories?: string[];
  forcedCategorySafe?: string; // если задан — грузим строго в эту папку
};

type UploadResp = {
  ok: boolean;
  key?: string;
  url?: string;
  categorySafe?: string;
  reason?: string;
  error?: string;
};

export default function UploadClient({ defaultCategory, categories = [], forcedCategorySafe }: Props) {
  const [category, setCategory] = useState<string>(defaultCategory ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function doUpload(file: File) {
    setMsg(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);

      if (forcedCategorySafe) {
        fd.append("forcedCategorySafe", forcedCategorySafe);
      } else {
        const human = (category || "general").trim();
        fd.append("category", human);
      }

      const r = await fetch("/api/weekly/upload", { method: "POST", body: fd });
      const raw: unknown = await r.json().catch(() => ({}));
      const data = raw as Partial<UploadResp>;

      if (!r.ok || data.ok !== true) {
        setMsg(`Ошибка загрузки: ${data.reason ?? data.error ?? r.status}`);
      } else {
        const safe = data.categorySafe ?? forcedCategorySafe ?? "";
        // маленькая задержка + анти-кеш, чтобы листинг точно увидел новый файл
        await new Promise((res) => setTimeout(res, 250));
        const ts = Date.now();
        const dest = safe ? `/weekly/${safe}?t=${ts}` : `${window.location.pathname}?t=${ts}`;
        window.location.href = dest;
      }
    } catch (e) {
      setMsg(String(e));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) void doUpload(f);
  }

  // Вставка из буфера
  async function onPaste(e: React.ClipboardEvent<HTMLDivElement>) {
    const items = e.clipboardData?.items ?? [];
    for (const it of items) {
      if (it.type.startsWith("image/")) {
        const f = it.getAsFile();
        if (f) {
          await doUpload(f);
          break;
        }
      }
    }
  }

  const showCategoryInput = !forcedCategorySafe;

  return (
    <div className="rounded-xl border border-white/10 p-4 bg-white/5">
      <div
        className="flex flex-col sm:flex-row items-start sm:items-end gap-3"
        onPaste={onPaste}
      >
        {showCategoryInput ? (
          <div className="flex flex-col">
            <label className="text-sm text-white/70 mb-1">Категория/папка</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              list="weekly-cats"
              placeholder="Напр.: Апрель 2025"
              className="bg-transparent border border-white/20 rounded px-3 py-2 text-sm text-white w-64"
            />
            {categories.length > 0 && (
              <datalist id="weekly-cats">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            )}
            <span className="text-xs text-white/50 mt-1">
              Можно создать новую папку, просто введя её имя.
            </span>
          </div>
        ) : (
          <div className="text-sm text-white/80">
            Загрузка в папку: <span className="font-medium">{decodeURIComponent(forcedCategorySafe)}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onFile}
            disabled={busy}
            className="text-sm"
          />
          <span className="text-xs text-white/60">
            Поддерживается вставка из буфера (Ctrl/⌘+V).
          </span>
        </div>
      </div>

      {msg && <div className="mt-2 text-sm text-white/80">{msg}</div>}
    </div>
  );
}
