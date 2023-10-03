import axios from 'axios';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';
import { IAaveProposalResponse } from 'adapters/chain/aave/types';
import { useQuery } from '@tanstack/react-query';
import { ChainNetwork } from 'common-common/src/types';

const RAW_PROPOSAL_STALE_TIME = 30000; // 30 seconds

const fetchRawAaveProposals = async (
  chainId: string
): Promise<IAaveProposalResponse[]> => {
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

const useRawAaveProposalsQuery = ({
  chainId,
  chainNetwork,
}: {
  chainId: string;
  chainNetwork: ChainNetwork;
}) => {
  const key = [ApiEndpoints.FETCH_PROPOSALS, chainId] as any;
  return useQuery({
    queryKey: key,
    queryFn: () => fetchRawAaveProposals(chainId),
    enabled: chainNetwork === ChainNetwork.Aave,
    staleTime: RAW_PROPOSAL_STALE_TIME,
  });
};

export default useRawAaveProposalsQuery;
