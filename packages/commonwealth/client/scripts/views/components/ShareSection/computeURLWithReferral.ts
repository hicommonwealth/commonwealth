export function computeURLWithReferral(
  url: string,
  refcode: string | undefined,
) {
  if (!refcode) {
    return url;
  }

  const u = new URL(url);
  u.searchParams.set('refcode', refcode);
  return u.toString();
}
