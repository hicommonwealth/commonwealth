import { useEffect, useState } from 'react';

import { ChainBase } from '@hicommonwealth/core';
import { chainBaseToCanvasChainId } from 'canvas';
import { getSessionSigners } from 'shared/canvas/verify';
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
      : app.chain?.meta.node?.ethChainId;
  const canvasChainId = chainBaseToCanvasChainId(chainBase, idOrPrefix);

  const [authenticatedAddresses, setAuthenticatedAddresses] = useState<{
    [address: string]: boolean;
  }>({});

  useEffect(() => {
    getSessionSigners().then((sessionSigners) => {
      const newAuthenticatedAddresses: Record<string, boolean> = {};

      for (const account of userActiveAccounts) {
        // find a session signer that matches
        const matchedSessionSigner = sessionSigners.find((sessionSigner) =>
          sessionSigner.match(account.address),
        );
        if (!matchedSessionSigner) {
          newAuthenticatedAddresses[account.address] = false;
          continue;
        }
        // check if it has an authorised session
        newAuthenticatedAddresses[account.address] =
          matchedSessionSigner.hasSession(account.address);
      }

      setAuthenticatedAddresses(newAuthenticatedAddresses);
    });
  }, [canvasChainId, chainBase, userActiveAccounts, recheck]);

  return { authenticatedAddresses };
};

export default useCheckAuthenticatedAddresses;
