import app from 'state';
import { useQuery } from '@tanstack/react-query';
import Cosmos from 'controllers/chain/cosmos/adapter';
import { ApiReadyProps } from './types';

const useVotingPeriodQuery = ({ isApiReady }: ApiReadyProps) => {
  const cosmosChain = app.chain as Cosmos;
  const governance = cosmosChain.governance;
  return useQuery({
    queryKey: ['votingPeriod', { id: cosmosChain.id }],
    queryFn: () => governance.fetchVotingPeriod(),
    enabled: isApiReady,
    cacheTime: Infinity, // TODO
  });
};

export { useVotingPeriodQuery };
