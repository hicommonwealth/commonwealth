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

const useDepositParamsQuery = () => {
  const chainId = app.activeChainId();
  return useQuery({
    queryKey: ['depositParams', chainId],
    queryFn: fetchDepositParams,
    enabled: app.chain?.base === ChainBase.CosmosSDK,
    cacheTime: DEPOSIT_PARAMS_CACHE_TIME,
    staleTime: DEPOSIT_PARAMS_STALE_TIME,
  });
};

export { useDepositParamsQuery };
