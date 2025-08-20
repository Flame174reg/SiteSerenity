import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Контракты",
  description: "Актуальные открытые контракты и выплаты",
};

type Resource = { name: string; qty: string; pay: string };

const farm: Resource[] = [
  { name: "Апельсины", qty: "3.800 шт.", pay: "26$ за 1 шт." },
  { name: "Пшеница", qty: "520 шт.", pay: "256$ за 1 шт." },
  { name: "Картофель", qty: "520 шт.", pay: "321$ за 1 шт." },
  { name: "Капуста", qty: "520 шт.", pay: "461$ за 1 шт." },
  { name: "Кукуруза", qty: "520 шт.", pay: "634$ за 1 шт." },
  { name: "Тыквы", qty: "430 шт.", pay: "906$ за 1 шт." },
  { name: "Бананы", qty: "370 шт.", pay: "1.221$ за 1 шт." },
];

const logs: Resource[] = [
  { name: "Сосна", qty: "720 брёвен", pay: "125$ за 1 шт." },
  { name: "Дуб", qty: "680 шт.", pay: "189$ за 1 шт." },
  { name: "Берёза", qty: "700 шт.", pay: "245$ за 1 шт." },
  { name: "Клён", qty: "720 шт.", pay: "320$ за 1 шт." },
];

const mushrooms: Resource[] = [
  { name: "Шампиньоны", qty: "1.340 шт.", pay: "93$ за 1 шт." },
  { name: "Вёшенки", qty: "1.040 шт.", pay: "133$ за 1 шт." },
  { name: "Гипсизигусы", qty: "1.360 шт.", pay: "112$ за 1 шт." },
  { name: "Мухоморы", qty: "740 шт.", pay: "224$ за 1 шт." },
  { name: "Подболотники", qty: "760 шт.", pay: "243$ за 1 шт." },
  { name: "Подберёзовики", qty: "600 шт.", pay: "333$ за 1 шт." },
];

function ResourceTable({
  title,
  data,
}: {
  title: string;
  data: Resource[];
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-xl font-semibold">{title}</h3>
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
        <table className="min-w-full text-sm">
          <thead className="text-left text-white/70">
            <tr>
              <th className="px-4 py-3">Ресурс</th>
              <th className="px-4 py-3">Объём</th>
              <th className="px-4 py-3">Оплата</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {data.map((row, i) => (
              <tr key={i} className="odd:bg-white/0 even:bg-white/[0.03]">
                <td className="px-4 py-3">{row.name}</td>
                <td className="px-4 py-3">{row.qty}</td>
                <td className="px-4 py-3">{row.pay}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function ContractsPage() {
  return (
    <main className="px-6 py-8">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Шапка */}
        <header className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight">Контракты</h1>
          <p className="text-gray-400">
            Здесь представлен полный перечень контрактов, которые находятся в статусе
            открытых, а также суммы выплат по каждому из них.
          </p>
          <p className="text-gray-400">
            Выплаты осуществляются еженедельно в форме премирования участников, которые
            ежедневно выполняют или помогают в выполнении контрактов.
          </p>
        </header>

        {/* Сколько платим */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Сколько платим за контракты?</h2>

          <div className="grid gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="font-medium">Дары моря VI</p>
              <p className="text-white/80">
                Требуемая рыба: прибрежный басс, снук, альбула. Оплата по рыночной стоимости.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="font-medium">Дары моря VII</p>
              <p className="text-white/80">
                Требуемая рыба: полосатый лаврак, барракуда, круглый трахинот. Оплата по рыночной стоимости.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="font-medium">Металлургия III</p>
              <p className="text-white/80">
                Требуемые руды: железо, серебро, медь, олово, золото. Оплата выше рыночной стоимости.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="font-medium">Товар с поезда</p>
              <p className="text-white/80">
                Командой из 5 человек загрузить 140 мешков и затем каждому разгрузить
                по 28 мешков на точке сдачи.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="font-medium">Товар с корабля</p>
              <p className="text-white/80">
                Командой из 5 человек загрузить 150 ящиков и затем каждому разгрузить
                по 30 ящиков на точке сдачи.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="font-medium">
                Ателье IV — открывается раз в неделю
              </p>
              <p className="text-white/80">
                Пошив по записи в канале{" "}
                <a
                  href="https://discordapp.com/channels/1334888994496053282/1370884710993236109"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:opacity-100 opacity-90"
                >
                  📌┃запись на контракт
                </a>
                . Общими усилиями за сутки необходимо пошить 665 форм Fed.Prison.
                Оплата составляет 800$ за 1 форму. Оплата будет производиться только тем,
                кто был записан!
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="font-medium">Тюнинг III</p>
              <p className="text-white/80">
                Личный контракт: пригнать транспорт с тюнингом по списку заказчика в
                арендованной у клуба байкеров мастерской. Оплата: от 12.500$ до 14.500$.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-white/80">
              Помимо этого есть бонусы за явку на Товар с поезда/Корабля и Металлургию.
              Собираемся один раз в день в определённое время. Актуальные объявления —
              в канале{" "}
              <a
                href="https://discordapp.com/channels/1334888994496053282/1336272791598792735"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:opacity-100 opacity-90"
              >
                📢┃объявления
              </a>
              .
            </p>
          </div>
        </section>

        {/* Оптовая база */}
        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Информация по Оптовой Базе</h2>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
            <p className="text-white/80">
              Выплаты по ней мы производим в полном объёме. Расчёт ведётся по чёткой формуле:
            </p>
            <div className="rounded-lg bg-black/40 border border-white/10 p-3 text-sm">
              <div>
                <span className="opacity-80">Формула: </span>
                <span className="font-mono">
                  Общая сумма за контракт / Количество собранных единиц = Оплата за 1 единицу ресурса
                </span>
              </div>
              <div className="mt-2">
                <span className="opacity-80">Пример: </span>
                <span className="font-mono">
                  452.000$ / 370 = 1.221$ за 1 банан
                </span>
              </div>
            </div>
            <p className="text-white/80">Вся система полностью прозрачна и легко проверяема.</p>
          </div>
        </section>

        {/* Таблицы ресурсов */}
        <section className="space-y-8">
          <h2 className="text-2xl font-bold">Актуальные данные по каждому ресурсу</h2>
          <ResourceTable title="Ферма" data={farm} />
          <ResourceTable title="Брёвна" data={logs} />
          <ResourceTable title="Грибы" data={mushrooms} />
        </section>

        {/* Важная информация */}
        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Важная информация по сдаче ресурсов и контрактам</h2>
          <ul className="list-disc pl-6 space-y-2 text-white/90">
            <li>Все собранные ресурсы сдавайте исключительно на склад.</li>
            <li>Не нужно самостоятельно ехать и сдавать контракт — этим занимается старший состав семьи.</li>
            <li>
              Проверяйте, какие контракты у нас разблокированы — выплачиваем только по тем ресурсам, по которым открыт
              семейный контракт.
            </li>
            <li>
              Если, например, у вас уже доступна возможность собирать бананы, но в ветке семейных контрактов этот контракт ещё не открыт,
              выплата за такие ресурсы начислена не будет.
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
