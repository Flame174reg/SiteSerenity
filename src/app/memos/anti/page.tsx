import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Памятки — Против душки адвокатов",
  description: "Короткая памятка по взаимодействию с адвокатом",
};

export default function AntiLawyersPage() {
  return (
    <main className="px-6 py-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight">💼 Общение с адвокатом</h1>
          <p className="text-gray-400">Памятка для быстрого ориентирования в разговоре.</p>
        </header>

        {/* Блок 1 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold">Приходит адвокат — ваши действия</h2>
          <ul className="list-disc pl-6 space-y-1 leading-relaxed marker:text-gray-500">
            <li>Попросите показать удостоверение.</li>
            <li>Начните первый диалог: коротко опишите, что совершил задержанный и за что задержан.</li>
            <li>Предложите адвокату конфиденциальную беседу с задержанным.</li>
          </ul>
        </section>

        {/* Блок 2 */}
        <section className="space-y-2">
          <h2 className="text-xl font-bold">Сложные вопросы от адвоката</h2>
          <p className="leading-relaxed">
            Если адвокат начинает спрашивать про &laquo;субъективную/объективную сторону преступления&raquo; и т.п. —
            спокойно ответьте, что всё будет показано на видеофиксации.
          </p>
        </section>

        {/* Блок 3 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold">Напор/провокация</h2>
          <p className="leading-relaxed">
            Если звучит: «Быстро отвечайте! Вы препятствуете моей деятельности?!» —
            ваш ответ: всё покажете на видеофиксации; ситуацию уже объяснили, непонятное покажете на видео.
          </p>
        </section>

        {/* Блок 4 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold">Контр-вопросы адвокату</h2>
          <p className="opacity-80">
            Если давление продолжается, задайте уточняющие вопросы:
          </p>
          <ul className="list-disc pl-6 space-y-1 leading-relaxed marker:text-gray-500">
            <li>
              Какую стратегию защиты вы выбрали для задержанного? Мне нужно убедиться, что вы способны защитить его
              конституционные права. <span className="opacity-60">(Если ответ «никакую» — действуйте по ситуации.)</span>
            </li>
            <li>
              При выстраивании линии защиты на какие принципы и нормы процессуального законодательства вы опираетесь?
            </li>
            <li>
              Основываясь на конституционном патернализме и нормах процессуального права, учитывая парадигмы,
              установленными нормами законодательства, каковы претензии со стороны доверителя ко мне как представителю
              государства в данных разбирательствах?{" "}
              <span className="opacity-60">(&laquo;Вы меня не так поняли&raquo; — если нужно переспрашивайте.)</span>
            </li>
            <li>
              В рамках досудебных разбирательств согласно нормам процессуального законодательства — какие материалы
              необходимо предоставить и почему?
            </li>
          </ul>
        </section>

        {/* Блок 5 */}
        <section className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="leading-relaxed">
            ⚠️ Помните: адвокат даёт рекомендацию. Окончательное решение принимается в рамках установленных правил и
            процедур.
          </p>
        </section>
      </div>
    </main>
  );
}
