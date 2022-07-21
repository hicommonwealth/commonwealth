export function validateSecret(secret: string): boolean {
  const expectedSecret = process.env.TBC_SECRET;
  if (!expectedSecret || !secret || expectedSecret !== secret) return false;
  return true;
}
