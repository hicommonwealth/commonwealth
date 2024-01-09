import { ChainBase } from '@hicommonwealth/core';
import { useQuery } from '@tanstack/react-query';
import Cosmos from 'controllers/chain/cosmos/adapter';
import {
  CosmosDepositParams,
  getDepositParams,
} from 'controllers/chain/cosmos/gov/v1beta1/utils-v1beta1';
import app from 'state';

const DEPOSIT_PARAMS_CACHE_TIME = Infinity;
const DEPOSIT_PARAMS_STALE_TIME = 1000 * 60 * 15;

const fetchDepositParams = async (
  stakingDenom: string,
): Promise<CosmosDepositParams> => {
  return getDepositParams(app.chain as Cosmos, stakingDenom);
};

const useDepositParamsQuery = (stakingDenom: string) => {
  const communityId = app.activeChainId();
  return useQuery({
    // fetchDepositParams depends on stakingDenom being defined
    queryKey: ['depositParams', communityId, stakingDenom],
    queryFn: () => fetchDepositParams(stakingDenom),
    enabled: app.chain?.base === ChainBase.CosmosSDK && !!stakingDenom,
    cacheTime: DEPOSIT_PARAMS_CACHE_TIME,
    staleTime: DEPOSIT_PARAMS_STALE_TIME,
  });
};

export { useDepositParamsQuery };
