export function buildFarcasterContentUrl(
  parentCastHash: string,
  replyCashHash: string,
) {
  return `/farcaster/${parentCastHash}/${replyCashHash}`;
}
