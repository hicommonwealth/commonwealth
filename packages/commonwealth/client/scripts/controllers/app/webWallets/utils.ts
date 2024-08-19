import { BalanceType } from '@hicommonwealth/shared';
import { fetchCachedNodes } from 'client/scripts/state/api/nodes';

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
