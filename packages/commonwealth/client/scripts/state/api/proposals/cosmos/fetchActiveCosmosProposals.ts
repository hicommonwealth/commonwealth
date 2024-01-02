import { ChainBase } from '@hicommonwealth/core';
import { useQuery } from '@tanstack/react-query';
import Cosmos from 'controllers/chain/cosmos/adapter';
import { getActiveProposals } from 'controllers/chain/cosmos/gov/utils';
import { CosmosProposal } from 'controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';
import app from 'state';

const ACTIVE_PROPOSALS_STALE_TIME = 1000 * 10;

const fetchActiveProposals = async (): Promise<CosmosProposal[]> => {
  return getActiveProposals(app.chain as Cosmos);
};

interface ActiveProposalsProps {
  isApiReady?: boolean;
}

const useActiveCosmosProposalsQuery = ({
  isApiReady,
}: ActiveProposalsProps) => {
  const communityId = app.activeChainId();
  return useQuery({
    queryKey: ['activeProposals', communityId],
    queryFn: fetchActiveProposals,
    enabled: app.chain?.base === ChainBase.CosmosSDK && isApiReady,
    retry: 5, // these can be problematic, so we retry
    staleTime: ACTIVE_PROPOSALS_STALE_TIME,
  });
};

export { useActiveCosmosProposalsQuery };
