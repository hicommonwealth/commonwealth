import { useEffect, useState } from 'react';

import { ChainBase } from '@hicommonwealth/shared';
import { chainBaseToCanvasChainId } from 'canvas';
import app from 'state';

interface UseCheckAuthenticatedAddressesProps {
  recheck: boolean;
}

const useCheckAuthenticatedAddresses = ({
  recheck,
}: UseCheckAuthenticatedAddressesProps) => {
  const userActiveAccounts = app.user.activeAccounts;
  const chainBase = app.chain?.base;
  const idOrPrefix =
    chainBase === ChainBase.CosmosSDK
      ? app.chain?.meta.bech32Prefix
      : app.chain?.meta.node?.ethChainId || 1;
  const canvasChainId = chainBaseToCanvasChainId(chainBase, idOrPrefix);

  const [authenticatedAddresses, setAuthenticatedAddresses] = useState<{
    [address: string]: boolean;
  }>({});

  useEffect(() => {
    const promises = userActiveAccounts.map(async (activeAccount) => {
      const isAuth = await app.sessions
        .getSessionController(chainBase)
        ?.hasAuthenticatedSession(canvasChainId, activeAccount.address);

      return {
        [activeAccount.address]: isAuth,
      };
    });

    Promise.all(promises).then((response) => {
      const reduced = response.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      setAuthenticatedAddresses(reduced);
    });
  }, [canvasChainId, chainBase, userActiveAccounts, recheck]);

  return { authenticatedAddresses };
};

export default useCheckAuthenticatedAddresses;
