import 'components/component_kit/cw_wallets_list.scss';
import { useEffect } from 'react';

type IuseBrowserWindow = {
  onResize: () => any;
  resizeListenerUpdateDeps: any[];
};

const useBrowserWindow = (windowProps: IuseBrowserWindow) => {
  useEffect(() => {
    // eslint-disable-next-line no-restricted-globals
    window.addEventListener('resize', windowProps.onResize);

    return () => {
      // eslint-disable-next-line no-restricted-globals
      window.removeEventListener('resize', windowProps.onResize);
    };
  }, windowProps.resizeListenerUpdateDeps);

  return {};
};

export default useBrowserWindow;
