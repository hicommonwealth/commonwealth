import useBrowserWindow from 'hooks/useBrowserWindow';
import app from 'state';

export function useQuickPostButtonActivated(): boolean {
  const { isWindowExtraSmall } = useBrowserWindow({});

  if (!isWindowExtraSmall) {
    // this is never activated on mobile.
    return false;
  }

  const scopedPage = app.activeChainId();

  return scopedPage !== null && scopedPage !== '';
}
