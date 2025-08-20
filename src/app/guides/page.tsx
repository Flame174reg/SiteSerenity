export const metadata = {
  title: 'Памятки',
  description: 'Свод памяток',
};

export default function GuidesPage() {
  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">Памятки</h1>
          <p className="opacity-70 text-sm">
            Собрали материалы в одном месте. Разделы будут пополняться.
          </p>
        </header>

        <section id="gov" className="space-y-3 scroll-mt-24">
          <h2 className="text-2xl font-semibold">Памятки госника</h2>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="opacity-80">
              Материалы готовятся. Предложения — Discord: <span className="font-medium">NevertoreX</span>.
            </p>
          </div>
        </section>

        <section id="interrogation" className="space-y-3 scroll-mt-24">
          <h2 className="text-2xl font-semibold">Памятка по допросам</h2>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="opacity-80">Раздел в разработке.</p>
          </div>
        </section>

        <section id="anti" className="space-y-3 scroll-mt-24">
          <h2 className="text-2xl font-semibold">Памятка против душки</h2>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="opacity-80">Раздел в разработке.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
