import useBrowserWindow from 'hooks/useBrowserWindow';
import { useFlag } from 'hooks/useFlag';
import app from 'state';

export function useQuickPostButtonActivated(): boolean {
  const newMobileNav = useFlag('newMobileNav');

  const { isWindowExtraSmall } = useBrowserWindow({});

  if (!newMobileNav) {
    return false;
  }

  if (!isWindowExtraSmall) {
    // this is never activated on mobile.
    return false;
  }

  const scopedPage = app.activeChainId();

  return scopedPage !== null && scopedPage !== '';
}
