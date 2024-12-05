import { useFlag } from 'hooks/useFlag';
import app from 'state';

export function useQuickPostButtonActivated() {
  const newMobileNav = useFlag('newMobileNav');

  if (!newMobileNav) {
    return false;
  }

  const scopedPage = app.activeChainId();

  // FIXME: this is never activated on mobile.

  if (!scopedPage) {
    return false;
  }

  return true;
}
