import { ChainBase } from '@hicommonwealth/shared';
import { useQuery } from '@tanstack/react-query';
import Cosmos from 'controllers/chain/cosmos/adapter';
import { getDepositParams as getAtomOneDepositParams } from 'controllers/chain/cosmos/gov/atomone/utils-v1';
import { getDepositParams as getGovgenDepositParams } from 'controllers/chain/cosmos/gov/govgen/utils-v1beta1';
import {
  CosmosDepositParams,
  getDepositParams,
} from 'controllers/chain/cosmos/gov/v1beta1/utils-v1beta1';
import app from 'state';

const DEPOSIT_PARAMS_CACHE_TIME = Infinity;
const DEPOSIT_PARAMS_STALE_TIME = 1000 * 60 * 15;

const fetchDepositParams = async (
  stakingDenom: string,
  chainTtype?: string,
): Promise<CosmosDepositParams> => {
  switch (chainTtype) {
    case 'govgen':
      return getGovgenDepositParams(app.chain as Cosmos, stakingDenom);
    case 'atomone':
      return getAtomOneDepositParams(app.chain as Cosmos, stakingDenom);
    default:
      return getDepositParams(app.chain as Cosmos, stakingDenom);
  }
};

const useDepositParamsQuery = (stakingDenom: string, chainTtype?: string) => {
  const communityId = app.activeChainId();
  return useQuery({
    // fetchDepositParams depends on stakingDenom being defined
    queryKey: ['depositParams', communityId, stakingDenom, chainTtype],
    queryFn: () => fetchDepositParams(stakingDenom, chainTtype),
    enabled: app.chain?.base === ChainBase.CosmosSDK && !!stakingDenom,
    gcTime: DEPOSIT_PARAMS_CACHE_TIME,
    staleTime: DEPOSIT_PARAMS_STALE_TIME,
  });
};

export { useDepositParamsQuery };
