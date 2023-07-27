import app from 'state';
import { useQuery } from '@tanstack/react-query';

import Cosmos from 'controllers/chain/cosmos/adapter';
import { ApiReadyProps } from './types';

const useDepositParamsQuery = ({ isApiReady }: ApiReadyProps) => {
  const cosmosChain = app.chain as Cosmos;
  const governance = cosmosChain.governance;
  const id = cosmosChain.id;

  return useQuery({
    queryKey: ['depositParams', { id }],
    queryFn: () => governance.fetchDepositParams(),
    enabled: isApiReady,
    cacheTime: Infinity, // TODO
    // queryKeyHashFn: (context: QueryFunctionContext) => {
    //   console.log('context', context);
    // },
    // refetchOnMount: false, // TODO
  });
};

export { useDepositParamsQuery };
