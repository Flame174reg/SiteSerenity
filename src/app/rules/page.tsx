const Tag = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-block px-2 py-0.5 rounded bg-white/10 text-xs align-middle ml-1">
    {children}
  </span>
);

export const metadata = {
  title: "Правила семьи",
  description: "Внутренние правила и политика сообщества",
  openGraph: {
    title: "Правила семьи",
    description: "Внутренние правила и политика сообщества",
    url: "https://site-serenity.vercel.app/rules",
    siteName: "Site Serenity",
    type: "article",
  },
};

export default function RulesPage() {
  return (
    <main id="top" className="px-6 py-10">
      <div className="mx-auto max-w-5xl grid gap-8 lg:grid-cols-[240px_1fr]">
        {/* Сайдбар со статическим содержанием */}
        <aside
          className="rounded-xl border border-white/10 bg-white/5 p-4 lg:sticky lg:top-6 h-max"
          role="navigation"
          aria-label="Содержание правил"
        >
          <p className="font-semibold mb-2">Содержание</p>
          <ul className="grid gap-1 text-sm">
            <li><a className="hover:underline" href="#p1">1. Общие положения</a></li>
            <li><a className="hover:underline" href="#p2">2. Dress-Code и транспорт</a></li>
            <li><a className="hover:underline" href="#p3">3. Общие запреты</a></li>
          </ul>
        </aside>

        {/* Контент */}
        <div className="space-y-10">
          {/* Шапка */}
          <section className="space-y-3">
            <h1 className="text-4xl font-extrabold tracking-tight">Правила семьи</h1>
            <p className="text-gray-400">
              Обновлённый свод правил. Незнание правил не освобождает от ответственности.
            </p>
          </section>

          {/* Раздел 1 */}
          <section id="p1" className="space-y-4 scroll-mt-24">
            <h2 className="text-2xl font-bold">1. Общие положения</h2>
            <ol className="list-decimal pl-6 space-y-2 leading-relaxed marker:text-gray-500">
              <li>Все участники семьи обязаны ознакомиться с настоящими правилами. Незнание правил не освобождает от ответственности.</li>
              <li>За нарушение правил участник может быть подвергнут дисциплинарным мерам, вплоть до увольнения.</li>
              <li>Увольнение применяется в случае, если участник не исправил свое поведение после предупреждения и повторил нарушение.</li>
              <li>Наказания выносит старший и руководящий состав с 7-го ранга и выше. Лидер и заместители имеют право пересматривать вынесенные наказания.</li>
              <li>Уважение – все члены семьи обязаны соблюдать уважительное отношение друг к другу и к окружающим.</li>
              <li>Семейная поддержка – каждый член семьи обязан помогать другим в пределах разумного (советом, ресурсами, информацией).</li>
              <li>Уведомление об уходе – если участник намерен покинуть семью, он обязан уведомить старший состав заранее.</li>
              <li>Обязанность информирования – участники обязаны уведомлять старший состав и руководство о крупных происшествиях, затрагивающих семью.</li>
              <li>Развитие семьи – участники могут предлагать идеи по улучшению структуры, системы повышения и организации мероприятий.</li>
              <li>Возрастное ограничение — набор в семью происходит исключительно от 18-ти лет.</li>
              <li>Секретность и конфиденциальность – вся информация о семье, её планах и действиях является закрытой и не подлежит разглашению посторонним лицам.</li>
              <li>Карьерный рост — блат в семье запрещен. Участник повышается строго по системе рангов.</li>
              <li>Разрешение конфликтов – внутренние споры должны решаться мирным путем. При невозможности урегулирования — обратиться к лидеру/заместителям.</li>
              <li>Наказания снимаются по усмотрению Лидера и его Заместителей, с учётом обстоятельств и поведения участника после наказания.</li>
              <li>Ответственность – каждый участник несет ответственность за свои действия и поступки как в рамках семьи, так и за ее пределами.</li>
              <li>При отсутствии участника в игре/Discord более 14 дней без уведомления — возможное исключение по причине Inactive. Если были невыплаченные средства, семья обязуется произвести расчет перед исключением.</li>
              <li>Старший состав от 7-го ранга обязан проверять заявки, отвечать кандидатам, проводить собеседования и добавлять новых участников в игру и Discord.</li>
            </ol>
          </section>

          <hr className="border-white/10" />

          {/* Раздел 2 */}
          <section id="p2" className="space-y-4 scroll-mt-24">
            <h2 className="text-2xl font-bold">2. Dress-Code и транспорт семьи</h2>
            <ol className="list-decimal pl-6 space-y-2 leading-relaxed marker:text-gray-500">
              <li>На мероприятиях каждый участник обязан носить полностью чёрную одежду (верх и низ) на активностях airdrop/тайники. Аксессуары — любого цвета.</li>
              <li>Личный транспорт на мероприятиях должен быть чёрного цвета.</li>
              <li>При передаче личного транспорта в распоряжение семьи — предварительно перекрасить в чёрный.</li>
              <li>Нарушение Dress-Code/требований к транспорту расценивается как проявление неуважения к семье. <Tag>WARN</Tag></li>
            </ol>
          </section>

          <hr className="border-white/10" />

          {/* Раздел 3 */}
          <section id="p3" className="space-y-4 scroll-mt-24">
            <h2 className="text-2xl font-bold">3. Общие запреты</h2>
            <ol className="list-decimal pl-6 space-y-2 leading-relaxed marker:text-gray-500">
              <li>Разглашение информации — запрещено передавать третьим лицам любые сведения о семье. <Tag>TIMEOUT ≥1 день</Tag><Tag>WARN</Tag></li>
              <li>Оскорбления — запрещены любые формы унижения членов семьи… <Tag>TIMEOUT ≥1 час</Tag><Tag>WARN</Tag></li>
              <li>Аморальные поступки и неадекватное поведение — запрещены действия, дискредитирующие семью. <Tag>TIMEOUT ≥1 день</Tag><Tag>WARN</Tag><Tag>KICK</Tag></li>
              <li>Запрещено распространять ложную информацию… <Tag>WARN</Tag><Tag>KICK</Tag></li>
              <li>Разжигание конфликтов… <Tag>WARN</Tag><Tag>KICK</Tag></li>
              <li>Флуд и спам… <Tag>WARN</Tag></li>
              <li>Обман, манипуляции, угрозы… <Tag>TIMEOUT ≥7 дней</Tag><Tag>WARN</Tag><Tag>KICK</Tag></li>
              <li>Использование семьи для личных конфликтов/выгоды. <Tag>WARN</Tag><Tag>KICK</Tag></li>
              <li>Самовольные переговоры от имени семьи… <Tag>WARN</Tag><Tag>KICK</Tag></li>
              <li>Инициирование войны… <Tag>WARN</Tag><Tag>KICK</Tag></li>
              <li>Игнорирование собраний… <Tag>WARN</Tag><Tag>Лишение премии</Tag></li>
              <li>Присвоение ресурсов… <Tag>WARN</Tag><Tag>KICK</Tag></li>
              <li>Неуважение к руководству… <Tag>TIMEOUT ≥1 час</Tag></li>
              <li>Беспричинная агрессия… <Tag>WARN</Tag></li>
              <li>Читы, макросы, багаюзы/эксплойты. <Tag>KICK</Tag></li>
              <li>Злоупотребление властью… <Tag>WARN</Tag><Tag>KICK</Tag></li>
              <li>Мнимое присвоение полномочий… <Tag>TIMEOUT ≥1 день</Tag></li>
              <li>Распространение персональных данных… <Tag>PERMOBAN</Tag><Tag>KICK</Tag></li>
              <li>Попытки обхода наказаний… <Tag>BAN ≥15 дней</Tag><Tag>KICK</Tag></li>
              <li>Провокационные действия… <Tag>TIMEOUT ≥1 день</Tag></li>
              <li>Политические/расовые/межнациональные темы… <Tag>TIMEOUT 7 дней</Tag></li>
              <li>Сделки/услуги за реальную валюту… <Tag>PERMOBAN</Tag><Tag>KICK</Tag></li>
              <li>Мошенничество… <Tag>PERMOBAN</Tag><Tag>KICK</Tag></li>
              <li>Вредоносные ссылки/файлы/ПО… <Tag>PERMOBAN</Tag><Tag>KICK</Tag></li>
              <li>Ссылки на сторонние сервера/ресурсы… <Tag>WARN</Tag><Tag>MUTE ≥3 мин</Tag></li>
              <li>Материалы экстремистской/расистской/… <Tag>TIMEOUT ≥1 день</Tag></li>
              <li>Оффтоп и флуд в каналах строгого назначения. <Tag>TIMEOUT ≥1 день</Tag></li>
              <li>Спам/дубли/абуз верхнего регистра… <Tag>WARN</Tag><Tag>MUTE ≥3 мин</Tag></li>
              <li>Услуги по ставкам/стратегиям… <Tag>KICK</Tag></li>
              <li>Манипуляции/давление ради выгоды… <Tag>KICK</Tag></li>
              <li>Недобросовестное исполнение обязанностей… <Tag>Понижение</Tag><Tag>KICK</Tag></li>
            </ol>
          </section>

          <div className="pt-2">
            <a href="#top" className="text-sm opacity-70 hover:opacity-100 underline">Наверх ↑</a>
          </div>
        </div>
      </div>
    </main>
  );
}
