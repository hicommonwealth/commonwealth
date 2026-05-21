export async function lazyLoadCommunityStakes() {
  return (await import('./CommunityStakes')).default;
}
