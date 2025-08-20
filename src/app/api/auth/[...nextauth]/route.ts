// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from "../../../../auth";

// ВАЖНО: Никаких других export в этом файле!
export const { GET, POST } = handlers;
