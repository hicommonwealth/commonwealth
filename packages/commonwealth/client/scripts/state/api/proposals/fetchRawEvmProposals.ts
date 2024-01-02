import { ChainNetwork } from '@hicommonwealth/core';
import { useQuery } from '@tanstack/react-query';
import { IAaveProposalResponse } from 'adapters/chain/aave/types';
import { ICompoundProposalResponse } from 'adapters/chain/compound/types';
import axios from 'axios';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';

const RAW_PROPOSAL_STALE_TIME = 30000; // 30 seconds

const fetchRawEvmProposals = async (
  communityId: string,
): Promise<IAaveProposalResponse[] | ICompoundProposalResponse[]> => {
  const res = await axios.get(
    `${app.serverUrl()}${ApiEndpoints.FETCH_PROPOSALS}`,
    {
      params: {
        chainId: communityId,
      },
    },
  );

  return res.data.result.proposals;
};

const useRawEvmProposalsQuery = ({
  communityId,
  chainNetwork,
}: {
  communityId: string;
  chainNetwork: ChainNetwork;
}) => {
  return useQuery({
    queryKey: [ApiEndpoints.FETCH_PROPOSALS, communityId, 'raw'],
    queryFn: () => fetchRawEvmProposals(communityId),
    enabled:
      chainNetwork === ChainNetwork.Aave ||
      chainNetwork === ChainNetwork.Compound,
    staleTime: RAW_PROPOSAL_STALE_TIME,
  });
};

export default useRawEvmProposalsQuery;
