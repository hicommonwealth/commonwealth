import { ChainBase } from '@hicommonwealth/shared';
import { useQuery } from '@tanstack/react-query';
import { CosmosProposalGovgen } from 'client/scripts/controllers/chain/cosmos/gov/govgen/proposal-v1beta1';
import Cosmos from 'controllers/chain/cosmos/adapter';
import { CosmosProposalV1 } from 'controllers/chain/cosmos/gov/v1/proposal-v1';
import { CosmosProposal } from 'controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';
import app from 'state';

const PROPOSAL_CACHE_TIME = 1000 * 60 * 60;
const PROPOSAL_STALE_TIME = 1000 * 10;

const fetchCosmosProposal = async (
  proposalId: string,
): Promise<
  CosmosProposal | CosmosProposalV1 | CosmosProposalGovgen | undefined
> => {
  try {
    const { governance } = app.chain as Cosmos;
    const proposal = await governance.getProposal(+proposalId);
    return proposal;
  } catch (err) {
    console.error('Failed to fetch cosmos proposal:', err);
    return undefined;
  }
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
    queryFn: async () => {
      const result = await fetchCosmosProposal(proposalId);
      if (!result) {
        throw new Error(`Proposal ${proposalId} not found or failed to load`);
      }
      return result;
    },
    enabled: app.chain?.base === ChainBase.CosmosSDK && isApiReady,
    staleTime: PROPOSAL_STALE_TIME,
    cacheTime: PROPOSAL_CACHE_TIME,
    retry: false, // Don't retry if proposal not found
  });
};

export { useCosmosProposalQuery };
