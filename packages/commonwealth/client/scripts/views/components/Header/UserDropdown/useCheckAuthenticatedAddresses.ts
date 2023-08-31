import { useEffect, useState } from 'react';
import app from 'state';
import { chainBaseToCanvasChainId } from 'canvas';
import { ChainBase } from 'common-common/src/types';

const useCheckAuthenticatedAddresses = () => {
  const userActiveAccounts = app.user.activeAccounts;
  const chainBase = app.chain?.base;
  const idOrPrefix =
    chainBase === ChainBase.CosmosSDK
      ? app.chain?.meta.bech32Prefix
      : app.chain?.meta.node?.ethChainId;
  const canvasChainId = chainBaseToCanvasChainId(chainBase, idOrPrefix);

  const [authenticatedAddresses, setAuthenticatedAddresses] = useState<{
    [address: string]: boolean;
  }>({});

  useEffect(() => {
    const promises = userActiveAccounts.map(async (activeAccount) => {
      const isAuth = await app.sessions
        .getSessionController(chainBase)
        .hasAuthenticatedSession(canvasChainId, activeAccount.address);

      return {
        [activeAccount.address]: isAuth,
      };
    });

    Promise.all(promises).then((response) => {
      const reduced = response.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      setAuthenticatedAddresses(reduced);
    });
  }, [canvasChainId, chainBase, userActiveAccounts]);

  return { authenticatedAddresses };
};

export default useCheckAuthenticatedAddresses;
