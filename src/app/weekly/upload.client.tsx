// src/app/weekly/upload.client.tsx
"use client";

import { useState } from "react";

export default function UploadClient({ defaultCategory }: { defaultCategory?: string }) {
  const [category, setCategory] = useState(defaultCategory || "general");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!file) {
      setMsg("Выберите файл");
      return;
    }
    const form = new FormData();
    form.append("category", category);
    form.append("file", file);

    setBusy(true);
    try {
      const res = await fetch("/api/weekly/upload", {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        setMsg(`Ошибка: ${data?.reason || data?.error || res.status}`);
      } else {
        setMsg(`Загружено: ${data.key}`);
        // Обновим страницу, чтобы увидеть новый элемент
        setTimeout(() => {
          window.location.reload();
        }, 600);
      }
    } catch (err) {
      setMsg(String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col sm:flex-row items-start gap-3 p-3 border rounded-lg">
      <div className="flex items-center gap-2">
        <label className="text-sm">Категория:</label>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value.trim().toLowerCase())}
          placeholder="например: nature"
          className="border rounded px-2 py-1 text-sm"
          required
          pattern="[\w\-]+"
          title="Только буквы/цифры/подчёркивание/дефис"
        />
      </div>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="text-sm"
        required
      />

      <button
        type="submit"
        disabled={busy}
        className="px-3 py-1 rounded bg-black text-white text-sm disabled:opacity-50"
      >
        {busy ? "Загрузка..." : "Загрузить"}
      </button>

      {msg && <div className="text-sm text-gray-600">{msg}</div>}
    </form>
  );
}
