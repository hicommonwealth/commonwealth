import { BalanceType } from '@hicommonwealth/core';
import app from 'state';

export const getCosmosChains = (isEvm?: boolean): string[] => {
  return (
    app?.config?.chains
      ?.getAll()
      ?.filter(
        (chain) =>
          chain.ChainNode?.balanceType === BalanceType.Cosmos &&
          (isEvm
            ? chain.ChainNode.slip44 === 60
            : chain.ChainNode.slip44 !== 60),
      )
      ?.map((chain) => chain.id) ?? []
  );
};
