import { useQuery } from '@tanstack/react-query';
import app from 'state';

import { ChainBase } from '@hicommonwealth/shared';
import Cosmos from 'controllers/chain/cosmos/adapter';
import { CosmosToken } from 'controllers/chain/cosmos/types';

const POOL_PARAMS_CACHE_TIME = Infinity;
const POOL_PARAMS_STALE_TIME = 1000 * 60 * 60;

const fetchPoolParams = async (): Promise<CosmosToken> => {
  return (app.chain as Cosmos).chain.fetchPoolParams();
};

const usePoolParamsQuery = () => {
  const communityId = app.activeChainId();
  return useQuery({
    queryKey: ['poolParams', communityId],
    queryFn: fetchPoolParams,
    enabled: app.chain?.base === ChainBase.CosmosSDK,
    cacheTime: POOL_PARAMS_CACHE_TIME,
    staleTime: POOL_PARAMS_STALE_TIME,
  });
};

export { usePoolParamsQuery };
