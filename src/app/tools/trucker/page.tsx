import type { Metadata } from "next";
import TruckerCalculator from "@/components/trucker/TruckerCalculator";

export const metadata: Metadata = {
  title: "Калькулятор дальнобойщика",
  description: "Подбор навыков и расчёт выплат",
};

export default function TruckerPage() {
  return (
    <main className="px-6 py-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight">Калькулятор дальнобойщика</h1>
          <p className="text-gray-400">
            Настрой уровни навыков и посмотри влияние на выплаты. Коэффициенты можно
            подправить в компоненте.
          </p>
        </header>

        <TruckerCalculator />
      </div>
    </main>
  );
}
