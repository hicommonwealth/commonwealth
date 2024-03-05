import { useEffect, useState } from 'react';

import { ChainBase } from '@hicommonwealth/core';
import { CANVAS_TOPIC, chainBaseToCanvasChainId } from 'canvas';
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
    const updateAuthenticatedAddresses = async () => {
      const sessionSigners = await getSessionSigners();

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
        let hasSession = false;
        try {
          await matchedSessionSigner.getCachedSession(
            CANVAS_TOPIC,
            account.address,
          );
          hasSession = true;
        } catch (e) {
          // do nothing
        }
        newAuthenticatedAddresses[account.address] = hasSession;
      }

      setAuthenticatedAddresses(newAuthenticatedAddresses);
    };
    updateAuthenticatedAddresses();
  }, [canvasChainId, chainBase, userActiveAccounts, recheck]);

  return { authenticatedAddresses };
};

export default useCheckAuthenticatedAddresses;
