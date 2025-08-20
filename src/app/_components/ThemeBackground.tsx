// src/app/_components/ThemeBackground.tsx
export default function ThemeBackground() {
  return (
    <>
      {/* Десктопные фоны */}
      <div
        aria-hidden
        className="
          pointer-events-none fixed inset-0 -z-10 hidden sm:block
          bg-center bg-cover opacity-90
          [background-image:url('/bg-light.webp')]
          dark:[background-image:url('/bg-dark.webp')]
        "
      />
      {/* Мобильные фоны */}
      <div
        aria-hidden
        className="
          pointer-events-none fixed inset-0 -z-10 sm:hidden
          bg-center bg-cover opacity-90
          [background-image:url('/bg-light-mobile.webp')]
          dark:[background-image:url('/bg-dark-mobile.webp')]
        "
      />
      {/* Подложка на случай, если картинки не загрузились */}
      <div className="fixed inset-0 -z-20 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
    </>
  );
}
