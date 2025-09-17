// src/app/weekly/upload.client.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  defaultCategory?: string;
  categories?: string[];
  /** если задано — категоря фиксирована (safe-сегмент папки) */
  forcedCategorySafe?: string;
  /** дернуть после успешной загрузки хотя бы одного файла */
  onUploaded?: () => void;
};

type UploadOneResp = { ok: true; key: string; url: string } | { ok: false; error?: string; reason?: string };

export default function UploadClient(props: Props) {
  const { defaultCategory, categories, forcedCategorySafe, onUploaded } = props;
  const [category, setCategory] = useState(defaultCategory ?? "");
  const [busy, setBusy] = useState(false);
  const [progressText, setProgressText] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const canChangeCategory = !forcedCategorySafe;

  // обновляем текст категории при смене props.defaultCategory
  useEffect(() => {
    if (defaultCategory) setCategory(defaultCategory);
  }, [defaultCategory]);

  // вставка изображений из буфера
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items || items.length === 0) return;
      const files: File[] = [];
      for (const it of items) {
        if (it.type.startsWith("image/")) {
          const f = it.getAsFile();
          if (f) files.push(f);
        }
      }
      if (files.length > 0) {
        void handleFiles(files);
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  async function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) await handleFiles(files);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleFiles(files: File[]) {
    if (files.length === 0) return;
    if (!forcedCategorySafe && !category.trim()) {
      alert("Укажите папку (категорию), либо откройте конкретную папку и загрузите туда.");
      return;
    }
    setBusy(true);
    setProgressText(`Загружаем ${files.length} шт...`);

    let uploaded = 0;
    try {
      for (const file of files) {
        const ok = await uploadOne(file);
        uploaded += Number(ok);
        setProgressText(`Загружено: ${uploaded} / ${files.length}`);
      }
      if (uploaded > 0 && onUploaded) onUploaded();
    } finally {
      setBusy(false);
      setProgressText(null);
    }
  }

  async function uploadOne(file: File): Promise<boolean> {
    const fd = new FormData();
    fd.append("file", file, file.name);

    if (forcedCategorySafe) {
      // фиксированная папка
      fd.append("safe", forcedCategorySafe);
    } else {
      // человекочитаемое имя папки — сервер сам создаст safe
      fd.append("category", category.trim());
    }

    const r = await fetch("/api/weekly/upload", { method: "POST", body: fd });
    const j = (await r.json()) as UploadOneResp;
    if (!j.ok) {
      alert(`Не удалось загрузить ${file.name}: ${j.error ?? j.reason ?? r.statusText}`);
      return false;
    }
    return true;
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 mb-2">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex-1">
          <label className="block text-sm text-white/70 mb-1">Категория/папка</label>
          {canChangeCategory ? (
            <input
              className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 outline-none"
              placeholder="Напр.: Апрель 2025"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              list={categories && categories.length ? "weekly-categories" : undefined}
            />
          ) : (
            <input
              className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 outline-none"
              value={decodeURIComponent(forcedCategorySafe)}
              disabled
            />
          )}

          {categories && categories.length > 0 && (
            <datalist id="weekly-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          )}
          <div className="text-xs text-white/50 mt-1">
            Можно создать новую папку, просто введя её имя. Поддерживается вставка из буфера (Ctrl/⌘+V).
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleInputChange}
            disabled={busy}
          />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 px-3 py-2 disabled:opacity-60"
          >
            Выбрать файлы
          </button>
        </div>

        {busy && <div className="text-sm text-white/70">{progressText}</div>}
      </div>
    </div>
  );
}
