"use client";

export default function Home() {
  return (
    <main className="min-h-[calc(100vh-56px)] grid place-items-center px-6">
      <div className="text-center space-y-3 rounded-2xl border border-white/10 bg-black/40 backdrop-blur px-6 py-5">
        <h1 className="text-3xl font-bold">В разработке</h1>
        <p className="text-sm opacity-80">
          Предложения в Discord: <span className="font-medium">NevertoreX</span>
        </p>
      </div>
    </main>
  );
}
