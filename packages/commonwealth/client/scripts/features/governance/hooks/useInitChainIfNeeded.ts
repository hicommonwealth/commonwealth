import { initChain } from 'helpers/chain';
import { useEffect, useRef } from 'react';
import { IApp } from 'state';

/**
 * Use in cases where chain data is needed but hasn't been fetched yet.
 * Once chain is intialized, the app.chainAdapterReady.emit('ready') event is emitted.
 * Components that depend on chain data can listen for this to trigger a re-render.
 *
 * Helper function initChain requires app.chain to be selected, otherwise this will do nothing.
 * So this will run after the chain is selected, but not if the chain is loaded already.
 */
export const useInitChainIfNeeded = (app: IApp) => {
  const hasFetchedRef = useRef(false); // prevent multiple calls to initChain

  useEffect(() => {
    const chainInit = async () => {
      if (!hasFetchedRef.current && !app.isAdapterReady) {
        hasFetchedRef.current = true;
        await initChain();
      }
    };

    chainInit();
  }, [app?.isAdapterReady]);
};
