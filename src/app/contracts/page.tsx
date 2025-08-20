export const metadata = {
  title: 'Контракты',
  description: 'Документы и шаблоны',
};

export default function ContractsPage() {
  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <h1 className="text-3xl font-bold">Контракты</h1>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="opacity-80">
            Раздел скоро будет наполнен шаблонами договоров и инструкциями.
            Предложения — Discord: <span className="font-medium">NevertoreX</span>.
          </p>
        </div>
      </div>
    </main>
  );
}
