import { factoryContracts, ValidChains } from '@hicommonwealth/evm-protocols';

export const chainIdsWithStakeEnabled = Object.values(factoryContracts)
  // we don't support stake on Blast anymore as of 23 Sept, 2024 (#9196)
  .filter((chain) => chain.chainId !== ValidChains.Blast)
  .map((c) => c.chainId);
