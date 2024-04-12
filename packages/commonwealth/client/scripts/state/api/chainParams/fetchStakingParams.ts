import { useQuery } from '@tanstack/react-query';
import app from 'state';

import { ChainBase } from '@hicommonwealth/shared';
import Cosmos from 'controllers/chain/cosmos/adapter';

const STAKING_PARAMS_CACHE_TIME = Infinity;
const STAKING_PARAMS_STALE_TIME = 1000 * 60 * 60;

const fetchStakingParams = async (): Promise<string> => {
  return (app.chain as Cosmos).chain.fetchStakingParams();
};

const useStakingParamsQuery = () => {
  const communityId = app.activeChainId();
  return useQuery({
    queryKey: ['stakingParams', communityId],
    queryFn: fetchStakingParams,
    enabled: app.chain?.base === ChainBase.CosmosSDK,
    cacheTime: STAKING_PARAMS_CACHE_TIME,
    staleTime: STAKING_PARAMS_STALE_TIME,
  });
};

export { useStakingParamsQuery };
