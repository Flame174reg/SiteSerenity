export const SUPER_ADMIN_ID =
  process.env.SUPER_ADMIN_ID ?? "1195944713639960601"; // твой Discord ID по умолчанию

export function isSuperAdmin(id?: string | null): boolean {
  return !!id && id === SUPER_ADMIN_ID;
}
