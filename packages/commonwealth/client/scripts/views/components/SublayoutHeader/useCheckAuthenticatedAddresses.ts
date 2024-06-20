import { useEffect, useState } from 'react';

import { ChainBase } from '@hicommonwealth/shared';
import { CANVAS_TOPIC, chainBaseToCanvasChainId } from 'canvas';
import { chainBaseToCaip2 } from 'shared/canvas/chainMappings';
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
      : app.chain?.meta.node?.ethChainId || 1;
  const canvasChainId = chainBaseToCanvasChainId(chainBase, idOrPrefix);

  const [authenticatedAddresses, setAuthenticatedAddresses] = useState<{
    [address: string]: boolean;
  }>({});

  useEffect(() => {
    const sessionSigners = getSessionSigners();

    const newAuthenticatedAddresses: Record<string, boolean> = {};

    for (const account of userActiveAccounts) {
      const communityCaip2Prefix = chainBaseToCaip2(account.community.base);

      const communityIdOrPrefix =
        account.community.base === ChainBase.CosmosSDK
          ? account.community.ChainNode?.bech32
          : account.community.ChainNode?.ethChainId;
      const communityCanvasChainId = chainBaseToCanvasChainId(
        account.community.base,
        // @ts-expect-error <StrictNullChecks>
        communityIdOrPrefix,
      );
      const did = `did:pkh:${communityCaip2Prefix}:${communityCanvasChainId}:${account.address}`;

      // find a session signer that matches
      const matchedSessionSigner = sessionSigners.find((sessionSigner) =>
        sessionSigner.match(did),
      );
      if (!matchedSessionSigner) {
        newAuthenticatedAddresses[did] = false;
        continue;
      }
      // check if it has an authorised session
      newAuthenticatedAddresses[did] = matchedSessionSigner.hasSession(
        CANVAS_TOPIC,
        did,
      );
    }

    setAuthenticatedAddresses(newAuthenticatedAddresses);
  }, [canvasChainId, chainBase, userActiveAccounts, recheck]);

  return { authenticatedAddresses };
};

export default useCheckAuthenticatedAddresses;
