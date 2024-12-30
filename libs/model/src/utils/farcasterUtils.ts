export function buildFarcasterContentUrl(
  parentCastHash: string,
  replyCashHash: string,
) {
  return `/farcaster/${parentCastHash}/${replyCashHash}`;
}

export function parseFarcasterContentUrl(url: string) {
  const [, , parentCastHash, replyCastHash] = url.split('/');
  return {
    parentCastHash,
    replyCastHash,
  };
}
