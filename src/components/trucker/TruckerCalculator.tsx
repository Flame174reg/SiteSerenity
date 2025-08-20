"use client";

import { useMemo, useState } from "react";

type SkillKey =
  | "exp"
  | "flex"
  | "overload"
  | "eco"
  | "schedule"
  | "night"
  | "package"
  | "loyalty";

type Skill = {
  key: SkillKey;
  title: string;
  max: number;
  step?: number;
  hint?: string;
};

const SKILLS: Skill[] = [
  { key: "exp",      title: "Опыт эксплуатации",     max: 5 },
  { key: "flex",     title: "Гибкий график",         max: 5 },
  { key: "overload", title: "Перевес",               max: 5 },
  { key: "eco",      title: "Экономичное вождение",  max: 5 },
  { key: "schedule", title: "Точное расписание",     max: 5 },
  { key: "night",    title: "Ночная доставка",       max: 5 },
  { key: "package",  title: "Прочная упаковка",      max: 5 },
  { key: "loyalty",  title: "Лояльность заказчика",  max: 5 },
];

// ЕДИНАЯ точка настройки математики.
// Меняешь проценты и базовые значения — результат пересчитывается.
const COEFF: Record<SkillKey, number> = {
  exp: 0.04,       // 4% за один уровень
  flex: 0.02,
  overload: 0.03,
  eco: 0.02,
  schedule: 0.02,
  night: 0.01,
  package: 0.01,
  loyalty: 0.02,
};

type State = {
  basePay: number;      // базовая выплата за рейс
  minutesPerRun: number;// средняя длительность рейса
  skills: Record<SkillKey, number>;
};

const initialState: State = {
  basePay: 1000,
  minutesPerRun: 10,
  skills: SKILLS.reduce((acc, s) => {
    acc[s.key] = 0;
    return acc;
  }, {} as Record<SkillKey, number>),
};

export default function TruckerCalculator() {
  const [state, setState] = useState<State>(initialState);

  const multiplier = useMemo(() => {
    let m = 1;
    for (const k of Object.keys(state.skills) as SkillKey[]) {
      m += COEFF[k] * state.skills[k];
    }
    return m;
  }, [state.skills]);

  const result = useMemo(() => {
    const payPerRun = Math.max(0, state.basePay) * multiplier;
    const runsPerHour = 60 / Math.max(1, state.minutesPerRun);
    const perHour = payPerRun * runsPerHour;

    return {
      payPerRun: Math.round(payPerRun),
      runsPerHour: Math.round(runsPerHour * 100) / 100,
      perHour: Math.round(perHour),
      multiplier: Math.round(multiplier * 100) / 100,
    };
  }, [state.basePay, state.minutesPerRun, multiplier]);

  const setSkill = (k: SkillKey, v: number) =>
    setState(s => ({ ...s, skills: { ...s.skills, [k]: v } }));

  const reset = () => setState(initialState);

  return (
    <div className="grid gap-6 md:grid-cols-[360px_1fr]">
      {/* ПАНЕЛЬ ВВОДА */}
      <section className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
        <h2 className="font-semibold">Параметры рейса</h2>

        <label className="block text-sm">
          <span className="opacity-75">Базовая выплата за рейс</span>
          <input
            type="number"
            value={state.basePay}
            onChange={e => setState(s => ({ ...s, basePay: Number(e.target.value || 0) }))}
            className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-white/30"
            min={0}
          />
        </label>

        <label className="block text-sm">
          <span className="opacity-75">Длительность рейса, минут</span>
          <input
            type="number"
            value={state.minutesPerRun}
            onChange={e => setState(s => ({ ...s, minutesPerRun: Number(e.target.value || 1) }))}
            className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-white/30"
            min={1}
          />
        </label>

        <button
          onClick={reset}
          className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm hover:bg-white/20"
        >
          Сбросить
        </button>
      </section>

      {/* НАВЫКИ + ИТОГ */}
      <section className="space-y-6">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="font-semibold mb-2">Навыки</h2>
          <div className="grid gap-3">
            {SKILLS.map(s => (
              <div key={s.key} className="grid grid-cols-[1fr_auto] items-center gap-3">
                <label className="text-sm">{s.title}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={s.max}
                    step={s.step ?? 1}
                    value={state.skills[s.key]}
                    onChange={e => setSkill(s.key, Number(e.target.value))}
                    className="w-48"
                  />
                  <span className="w-8 text-right text-sm tabular-nums">{state.skills[s.key]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="font-semibold mb-3">Результат</h2>
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <Stat label="Множитель" value={`×${result.multiplier}`} />
            <Stat label="Выплата за рейс" value={`${result.payPerRun.toLocaleString()} $`} />
            <Stat label="Рейсов в час" value={`${result.runsPerHour}`} />
            <Stat label="Доход в час" value={`${result.perHour.toLocaleString()} $`} />
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/30 p-3">
      <div className="opacity-70">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
