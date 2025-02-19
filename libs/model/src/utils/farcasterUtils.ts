export function buildFarcasterContentUrl(
  parentCastHash: string,
  replyCashHash: string,
  fid?: number,
) {
  let url = `/farcaster/${parentCastHash}/${replyCashHash}`;
  if (fid) {
    url += `?fid=${fid}`;
  }
  return url;
}

export function parseFarcasterContentUrl(url: string) {
  const [path, queryString] = url.split('?');
  const [, , parentCastHash, replyCastHash] = path.split('/');
  const params = new URLSearchParams(queryString);
  const fid = parseInt(params.get('fid') || '0') || null;
  return {
    parentCastHash,
    replyCastHash,
    fid,
  };
}
