import { ValidChains } from '@hicommonwealth/evm-protocols';
import { BalanceType } from '@hicommonwealth/shared';
import { models } from '../database';
import { ChainNodeInstance } from '../models';
import { buildChainNodeUrl } from './utils';

export function createTestRpc(
  ethChainId: ValidChains,
  scope: 'private' | 'public' = 'public',
): string {
  switch (ethChainId) {
    case ValidChains.Arbitrum:
      return buildChainNodeUrl('https://arb-mainnet.g.alchemy.com/v2/', scope);
    case ValidChains.Mainnet:
      return buildChainNodeUrl('https://eth-mainnet.g.alchemy.com/v2/', scope);
    case ValidChains.Optimism:
      return buildChainNodeUrl('https://opt-mainnet.g.alchemy.com/v2/', scope);
    case ValidChains.Linea:
      return buildChainNodeUrl(
        'https://linea-mainnet.g.alchemy.com/v2/',
        scope,
      );
    case ValidChains.Blast:
      return buildChainNodeUrl(
        'https://blast-mainnet.g.alchemy.com/v2/',
        scope,
      );
    case ValidChains.Sepolia:
      return buildChainNodeUrl('https://eth-sepolia.g.alchemy.com/v2/', scope);
    case ValidChains.SepoliaBase:
      return buildChainNodeUrl('https://base-sepolia.g.alchemy.com/v2/', scope);
    case ValidChains.Base:
      return buildChainNodeUrl('https://base-mainnet.g.alchemy.com/v2/', scope);
    case ValidChains.BSC:
      return buildChainNodeUrl('https://bnb-mainnet.g.alchemy.com/v2/', scope);
    case ValidChains.SKALE_TEST:
      return 'https://testnet.skalenodes.com/v1/giant-half-dual-testnet';
    case ValidChains.Anvil:
      return 'http://localhost:5502';
    default:
      throw new Error(`Eth chain id ${ethChainId} not supported`);
  }
}

export async function createEventRegistryChainNodes() {
  const promises: Array<Promise<[ChainNodeInstance, boolean]>> = [];
  for (const ethChainId of Object.values(ValidChains)) {
    if (typeof ethChainId === 'number') {
      promises.push(
        models.ChainNode.findOrCreate({
          where: {
            eth_chain_id: ethChainId,
          },
          defaults: {
            url: createTestRpc(ethChainId),
            private_url: createTestRpc(ethChainId, 'private'),
            balance_type: BalanceType.Ethereum,
            name: `${ethChainId} Node`,
          },
        }),
      );
    }
  }
  const chainNodes = await Promise.all(promises);
  return chainNodes.map((c) => c[0]);
}
