"use client";
import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      className="px-3 py-2 rounded bg-white/10 hover:bg-white/20 transition"
      onClick={() => signOut()}
    >
      Выйти
    </button>
  );
}
