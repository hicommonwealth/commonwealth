export async function lazyLoadLaunchpad() {
  return (await import('./Launchpad')).default;
}
