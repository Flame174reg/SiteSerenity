// src/components/ThemeBackground.tsx
"use client";
export default function ThemeBackground() {
  return (
    <>
      {/* Декстопные фоны */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 hidden sm:block bg-center bg-cover opacity-90 [background-image:url('/bg-light.webp')] dark:[background-image:url('/bg-dark.webp')]"
      />

      {/* Мобильные фоны */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 sm:hidden bg-center bg-cover opacity-90 [background-image:url('/bg-light-mobile.webp')] dark:[background-image:url('/bg-dark-mobile.webp')]"
      />

      {/* Лёгкая градиентная подложка и радиальный акцент */}
      <div className="fixed inset-0 -z-20 bg-gradient-to-b from-transparent via-black/10 to-black/60" />
      <div
        aria-hidden
        className="fixed inset-0 -z-15 pointer-events-none"
        style={{
          background: 'radial-gradient(800px 400px at 10% 20%, rgba(124,58,237,0.10), transparent)'
        }}
      />
    </>
  );
}
