import { BalanceType, ChainBase } from '@hicommonwealth/shared';
import { fetchCachedNodes } from 'state/api/nodes';

export const getCosmosChains = (isEvm?: boolean): string[] => {
  const nodes = fetchCachedNodes();

  return (
    nodes
      ?.filter(
        (node) =>
          node.balanceType === BalanceType.Cosmos &&
          (isEvm ? node.slip44 === 60 : node.slip44 !== 60) &&
          node.cosmosChainId,
      )
      ?.map((node) => node.cosmosChainId || '') ?? []
  );
};

export const getChainDecimals = (
  chainId: string,
  chainBase: ChainBase,
): number => {
  let decimals = chainBase === ChainBase.CosmosSDK ? 6 : 18;

  if (getCosmosChains(true)?.some((c) => c === chainId)) {
    decimals = 18;
  }

  return decimals;
};
