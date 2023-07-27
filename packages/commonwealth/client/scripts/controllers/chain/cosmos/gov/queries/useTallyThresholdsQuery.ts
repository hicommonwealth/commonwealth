import app from 'state';
import { useQuery } from '@tanstack/react-query';
import Cosmos from 'controllers/chain/cosmos/adapter';
import { ApiReadyProps } from './types';

const useTallyThresholdsQuery = ({ isApiReady }: ApiReadyProps) => {
  const cosmosChain = app.chain as Cosmos;
  const governance = cosmosChain.governance;
  return useQuery({
    queryKey: ['tallyThresholds', { id: cosmosChain.id }],
    queryFn: () => governance.fetchTallyThresholds(),
    enabled: isApiReady,
    cacheTime: Infinity, // TODO
  });
};

export { useTallyThresholdsQuery };
