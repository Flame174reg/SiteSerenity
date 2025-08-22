import { list, put } from "@vercel/blob";

export type StoredUser = {
  id: string;
  name?: string;
  avatar?: string;
  lastSeen: string;
};

const ADMIN_FILE = "admin/admins.json";
const USERS_FILE = "admin/users.json";
const token = process.env.BLOB_READ_WRITE_TOKEN;

export const OWNER_ID = "1195944713639960601";

async function readJSON<T>(path: string, fallback: T): Promise<T> {
  const { blobs } = await list({ prefix: path, token });
  const b = blobs.find((x) => x.pathname === path);
  if (!b) return fallback;
  const r = await fetch(b.url, { cache: "no-store" });
  return (await r.json()) as T;
}

async function writeJSON<T>(path: string, data: T): Promise<void> {
  await put(path, JSON.stringify(data, null, 2), {
    access: "public",
    token,
    contentType: "application/json",
  });
}

export async function getAdmins(): Promise<Set<string>> {
  const data = await readJSON<{ admins: string[] }>(ADMIN_FILE, { admins: [] });
  return new Set((data.admins ?? []).map(String));
}

export async function setAdmin(id: string, admin: boolean): Promise<void> {
  const set = await getAdmins();
  if (admin) set.add(id);
  else set.delete(id);
  await writeJSON(ADMIN_FILE, { admins: [...set] });
}

export async function getUsers(): Promise<StoredUser[]> {
  const data = await readJSON<{ users: StoredUser[] }>(USERS_FILE, { users: [] });
  return Array.isArray(data.users) ? data.users : [];
}

export async function upsertUser(u: StoredUser): Promise<void> {
  const users = await getUsers();
  const i = users.findIndex((x) => x.id === u.id);
  if (i >= 0) users[i] = { ...users[i], ...u };
  else users.push(u);
  await writeJSON(USERS_FILE, { users });
}

export async function isAdminOrOwner(discordId?: string): Promise<boolean> {
  if (!discordId) return false;
  if (discordId === OWNER_ID) return true;
  const admins = await getAdmins();
  return admins.has(discordId);
}
