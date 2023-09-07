import app from 'state';
import { useQuery } from '@tanstack/react-query';
import Cosmos from 'controllers/chain/cosmos/adapter';
import { ChainBase } from 'common-common/src/types';
import {
  CosmosDepositParams,
  getDepositParams,
} from 'controllers/chain/cosmos/gov/v1beta1/utils-v1beta1';

const DEPOSIT_PARAMS_CACHE_TIME = Infinity;
const DEPOSIT_PARAMS_STALE_TIME = 1000 * 60 * 15;

const fetchDepositParams = async (): Promise<CosmosDepositParams> => {
  return getDepositParams(app.chain as Cosmos);
};

// proposal.isPassing depends on staking denom being defined
const useDepositParamsQuery = (stakingDenom: string) => {
  const chainId = app.activeChainId();
  return useQuery({
    queryKey: ['depositParams', chainId, stakingDenom],
    queryFn: fetchDepositParams,
    enabled: app.chain?.base === ChainBase.CosmosSDK,
    cacheTime: DEPOSIT_PARAMS_CACHE_TIME,
    staleTime: DEPOSIT_PARAMS_STALE_TIME,
  });
};

export { useDepositParamsQuery };
