import { ChainBase } from '@hicommonwealth/core';
import { useQuery } from '@tanstack/react-query';
import Cosmos from 'controllers/chain/cosmos/adapter';
import { CosmosProposalV1 } from 'controllers/chain/cosmos/gov/v1/proposal-v1';
import { CosmosProposal } from 'controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';
import app from 'state';

const PROPOSAL_CACHE_TIME = 1000 * 60 * 60;
const PROPOSAL_STALE_TIME = 1000 * 10;

const fetchCosmosProposal = async (
  proposalId: string,
): Promise<CosmosProposal | CosmosProposalV1> => {
  const { governance } = app.chain as Cosmos;
  return governance.getProposal(+proposalId);
};

interface CosmosProposalQueryProps {
  isApiReady?: boolean;
  proposalId: string;
}

const useCosmosProposalQuery = ({
  isApiReady,
  proposalId,
}: CosmosProposalQueryProps) => {
  const communityId = app.activeChainId();
  return useQuery({
    queryKey: ['proposal', { communityId, proposalId }],
    queryFn: () => fetchCosmosProposal(proposalId),
    enabled: app.chain?.base === ChainBase.CosmosSDK && isApiReady,
    staleTime: PROPOSAL_STALE_TIME,
    cacheTime: PROPOSAL_CACHE_TIME,
  });
};

export { useCosmosProposalQuery };
