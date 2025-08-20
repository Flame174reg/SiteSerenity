export const SUPERADMINS = (process.env.ADMIN_DISCORD_IDS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export function isSuperAdmin(discordId?: string | null) {
  return !!discordId && SUPERADMINS.includes(discordId);
}
