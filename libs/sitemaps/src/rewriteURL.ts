/**
 * AWS returns invalid URLs not the domain masked URL.
 */
export function rewriteURL(url: string, hostname: string | undefined): string {
  if (!hostname) {
    return url;
  }

  const u = new URL(url);
  u.hostname = hostname;
  return u.toString();
}
