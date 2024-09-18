import { useCallback, useEffect, useState } from 'react';

import {
  CANVAS_TOPIC,
  ChainBase,
  chainBaseToCaip2,
  chainBaseToCanvasChainId,
  getSessionSigners,
} from '@hicommonwealth/shared';
import app from 'state';
import { EXCEPTION_CASE_VANILLA_getCommunityById } from 'state/api/communities/getCommuityById';
import useUserStore from 'state/ui/user';

interface UseCheckAuthenticatedAddressesProps {
  recheck: boolean;
}

const useCheckAuthenticatedAddresses = ({
  recheck,
}: UseCheckAuthenticatedAddressesProps) => {
  const user = useUserStore();
  const chainBase = app.chain?.base;
  const idOrPrefix =
    chainBase === ChainBase.CosmosSDK
      ? app.chain?.meta.bech32_prefix || 0
      : app.chain?.meta?.ChainNode?.eth_chain_id || 1;
  const canvasChainId = chainBaseToCanvasChainId(chainBase, idOrPrefix);

  const [authenticatedAddresses, setAuthenticatedAddresses] = useState<{
    [address: string]: boolean;
  }>({});

  const updateAuthenticatedAddresses = useCallback(async () => {
    const sessionSigners = getSessionSigners();

    const newAuthenticatedAddresses: Record<string, boolean> = {};

    for (const account of user.accounts) {
      // making a fresh query to get chain and community info for this address
      // as all the necessary fields don't exist on user.address, these should come
      // from api in the user address response, and the extra api call here removed
      const community = await EXCEPTION_CASE_VANILLA_getCommunityById(
        account.community.id,
        true,
      );
      if (!community) continue;

      const communityCaip2Prefix = chainBaseToCaip2(community.base);

      const communityIdOrPrefix =
        community.base === ChainBase.CosmosSDK
          ? community?.ChainNode?.bech32
          : community?.ChainNode?.eth_chain_id;
      const communityCanvasChainId = chainBaseToCanvasChainId(
        community.base,
        // @ts-expect-error <StrictNullChecks>
        communityIdOrPrefix,
      );
      const did: `did:${string}` = `did:pkh:${communityCaip2Prefix}:${communityCanvasChainId}:${account.address}`;

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
  }, [user.accounts]);

  useEffect(() => {
    updateAuthenticatedAddresses().catch(console.error);
  }, [updateAuthenticatedAddresses, canvasChainId, chainBase, recheck]);

  return { authenticatedAddresses };
};

export default useCheckAuthenticatedAddresses;
