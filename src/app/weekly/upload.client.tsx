"use client";

import { useEffect, useMemo, useState } from "react";

export default function UploadClient({
  defaultCategory,
  categories,
}: {
  defaultCategory?: string;
  categories: string[];
}) {
  const initial = defaultCategory && categories.includes(defaultCategory)
    ? defaultCategory
    : (categories[0] ?? "general");

  const [category, setCategory] = useState(initial);
  const [addingNew, setAddingNew] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (addingNew) setCategory("");
    else if (!category) setCategory(initial);
  }, [addingNew]); // eslint-disable-line

  const options = useMemo(() => {
    const set = new Set(categories);
    if (defaultCategory && !set.has(defaultCategory)) set.add(defaultCategory);
    return Array.from(set).sort();
  }, [categories, defaultCategory]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const cat = addingNew ? newCat.trim().toLowerCase() : category.trim().toLowerCase();
    if (!cat || !/^[\w\-]+$/.test(cat)) {
      setMsg("Укажите корректное имя папки (буквы/цифры/подчёркивание/дефис).");
      return;
    }
    if (!file) {
      setMsg("Выберите файл или вставьте из буфера.");
      return;
    }

    const form = new FormData();
    form.append("category", cat);
    form.append("file", file);

    setBusy(true);
    try {
      const res = await fetch("/api/weekly/upload", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        setMsg(`Ошибка: ${data?.reason || data?.error || res.status}`);
      } else {
        setMsg(`Загружено: ${data.key}`);
        setTimeout(() => window.location.href = `/weekly?category=${encodeURIComponent(cat)}`, 600);
      }
    } catch (err) {
      setMsg(String(err));
    } finally {
      setBusy(false);
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f && f.type.startsWith("image/")) setFile(f);
    else setMsg("Поддерживаются только изображения.");
  }

  // вставка из буфера
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      if (!e.clipboardData) return;
      for (const it of e.clipboardData.items as any) {
        if (it.kind === "file" && it.type.startsWith("image/")) {
          const blob = it.getAsFile();
          if (blob) {
            const file = new File([blob], `pasted_${Date.now()}.png`, { type: blob.type });
            setFile(file);
            setMsg("Изображение вставлено из буфера обмена");
            e.preventDefault();
            return;
          }
        }
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  return (
    <form onSubmit={onSubmit} className="p-4 rounded-xl border border-white/10 bg-black/30 backdrop-blur flex flex-col gap-3">
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        {/* Категория */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-white/90">Папка:</label>

          {!addingNew ? (
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm text-white"
            >
              {options.map((c) => (
                <option key={c} value={c} className="bg-black text-white">{c}</option>
              ))}
            </select>
          ) : (
            <input
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              placeholder="новая_папка"
              className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm text-white"
            />
          )}

          <button
            type="button"
            onClick={() => setAddingNew(!addingNew)}
            className="text-xs px-2 py-1 rounded border border-white/20 hover:bg-white/10"
            title={addingNew ? "Выбрать из списка" : "Добавить новую папку"}
          >
            {addingNew ? "Выбрать из списка" : "Добавить папку"}
          </button>
        </div>

        {/* Файл */}
        <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
          <span className="px-3 py-1 rounded border border-white/20 bg-white/5 hover:bg-white/10 text-white">
            Выберите файл
          </span>
          <input type="file" accept="image/*" onChange={onFile} className="hidden" />
        </label>

        <button
          type="submit"
          disabled={busy}
          className="px-3 py-1 rounded bg-white text-black text-sm font-medium disabled:opacity-50"
        >
          {busy ? "Загрузка..." : "Загрузить"}
        </button>
      </div>

      {file && (
        <div className="text-xs text-white/70">
          Файл: <span className="font-mono">{file.name}</span> ({Math.round(file.size / 1024)} KB)
        </div>
      )}
      <div className="text-xs text-white/60">
        Поддерживается вставка изображения из буфера: <kbd>Ctrl/Cmd</kbd> + <kbd>V</kbd>.
      </div>

      {msg && <div className="text-sm text-white">{msg}</div>}
    </form>
  );
}
