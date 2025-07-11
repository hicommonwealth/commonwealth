import type { QueryTallyResultResponseSDKType } from '@hicommonwealth/chains';
import { ChainBase } from '@hicommonwealth/shared';
import { useQuery } from '@tanstack/react-query';
import { CosmosProposalV1AtomOne } from 'client/scripts/controllers/chain/cosmos/gov/atomone/proposal-v1';
import { CosmosProposalGovgen } from 'client/scripts/controllers/chain/cosmos/gov/govgen/proposal-v1beta1';
import { CosmosProposalV1 } from 'controllers/chain/cosmos/gov/v1/proposal-v1';
import { CosmosProposal } from 'controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';
import type { QueryTallyResultResponse } from 'cosmjs-types/cosmos/gov/v1beta1/query';
import _ from 'lodash';
import { AnyProposal } from 'models/types';
import app from 'state';

const TALLY_CACHE_TIME = 1000 * 60 * 60;
const TALLY_STALE_TIME = 1000 * 30;

const fetchCosmosTally = async (
  proposal: AnyProposal,
): Promise<QueryTallyResultResponse | QueryTallyResultResponseSDKType> => {
  if (
    proposal instanceof CosmosProposalV1AtomOne ||
    proposal instanceof CosmosProposalV1 ||
    proposal instanceof CosmosProposal ||
    proposal instanceof CosmosProposalGovgen
  ) {
    return proposal.fetchTally();
  } else {
    // @ts-expect-error StrictNullChecks
    return null;
  }
};

const getCosmosVotesQueryKey = (proposal: AnyProposal) => {
  return [
    'cosmosTally',
    app.activeChainId(),
    proposal?.identifier,
    proposal?.support,
  ];
};

const useCosmosProposalTallyQuery = (proposal: AnyProposal) => {
  return useQuery({
    queryKey: getCosmosVotesQueryKey(proposal),
    queryFn: () => fetchCosmosTally(proposal),
    enabled:
      app.chain?.base === ChainBase.CosmosSDK &&
      !_.isEmpty(proposal) &&
      !proposal.completed,
    staleTime: TALLY_STALE_TIME,
    gcTime: TALLY_CACHE_TIME,
  });
};

export { useCosmosProposalTallyQuery };
