import axios from 'axios';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';
import { IAaveProposalResponse } from 'adapters/chain/aave/types';
import { useQuery } from '@tanstack/react-query';
import { ChainNetwork } from 'common-common/src/types';
import { ICompoundProposalResponse } from 'adapters/chain/compound/types';

const RAW_PROPOSAL_STALE_TIME = 30000; // 30 seconds

const fetchRawEvmProposals = async (
  chainId: string
): Promise<IAaveProposalResponse[] | ICompoundProposalResponse[]> => {
  const res = await axios.get(
    `${app.serverUrl()}${ApiEndpoints.FETCH_PROPOSALS}`,
    {
      params: {
        chainId: chainId,
      },
    }
  );

  return res.data.result.proposals;
};

const useRawEvmProposalsQuery = ({
  chainId,
  chainNetwork,
}: {
  chainId: string;
  chainNetwork: ChainNetwork;
}) => {
  return useQuery({
    queryKey: [ApiEndpoints.FETCH_PROPOSALS, chainId, 'raw'],
    queryFn: () => fetchRawEvmProposals(chainId),
    enabled:
      chainNetwork === ChainNetwork.Aave ||
      chainNetwork === ChainNetwork.Compound,
    staleTime: RAW_PROPOSAL_STALE_TIME,
  });
};

export default useRawEvmProposalsQuery;
