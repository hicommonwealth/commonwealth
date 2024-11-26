import {
  ChildContractNames,
  commonProtocol,
  EvmEventSignatures,
} from '@hicommonwealth/evm-protocols';
import {
  communityStakesAbi,
  namespaceFactoryAbi,
} from '@hicommonwealth/evm-testing';
import {
  buildChainNodeUrl,
  ChainNodeInstance,
  EvmEventSourceInstance,
  models,
} from '@hicommonwealth/model';
import { BalanceType } from '@hicommonwealth/shared';

export function createTestRpc(
  ethChainId: commonProtocol.ValidChains,
  scope: 'private' | 'public' = 'public',
): string {
  switch (ethChainId) {
    case commonProtocol.ValidChains.Arbitrum:
      return buildChainNodeUrl('https://arb-mainnet.g.alchemy.com/v2/', scope);
    case commonProtocol.ValidChains.Mainnet:
      return buildChainNodeUrl('https://eth-mainnet.g.alchemy.com/v2/', scope);
    case commonProtocol.ValidChains.Optimism:
      return buildChainNodeUrl('https://opt-mainnet.g.alchemy.com/v2/', scope);
    case commonProtocol.ValidChains.Linea:
      return buildChainNodeUrl(
        'https://linea-mainnet.g.alchemy.com/v2/',
        scope,
      );
    case commonProtocol.ValidChains.Blast:
      return buildChainNodeUrl(
        'https://blast-mainnet.g.alchemy.com/v2/',
        scope,
      );
    case commonProtocol.ValidChains.Sepolia:
      return buildChainNodeUrl('https://eth-sepolia.g.alchemy.com/v2/', scope);
    case commonProtocol.ValidChains.SepoliaBase:
      return buildChainNodeUrl('https://base-sepolia.g.alchemy.com/v2/', scope);
    case commonProtocol.ValidChains.Base:
      return buildChainNodeUrl('https://base-mainnet.g.alchemy.com/v2/', scope);
    default:
      throw new Error(`Eth chain id ${ethChainId} not supported`);
  }
}

export async function createEventRegistryChainNodes() {
  const promises: Array<Promise<[ChainNodeInstance, boolean]>> = [];
  for (const ethChainId of Object.values(commonProtocol.ValidChains)) {
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

export async function createContestEventSources(
  ethChainId: commonProtocol.ValidChains,
): Promise<{
  evmEventSourceInstances: EvmEventSourceInstance[];
}> {
  const evmEventSourceInstances = await models.EvmEventSource.bulkCreate([
    {
      eth_chain_id: ethChainId,
      contract_address:
        commonProtocol.factoryContracts[
          commonProtocol.ValidChains.SepoliaBase
        ].factory.toLowerCase(),
      event_signature: EvmEventSignatures.Contests.SingleContestStarted,
      contract_name: ChildContractNames.SingleContest,
      parent_contract_address:
        commonProtocol.factoryContracts[
          commonProtocol.ValidChains.SepoliaBase
        ].factory.toLowerCase(),
    },
    {
      eth_chain_id: ethChainId,
      contract_address:
        commonProtocol.factoryContracts[
          commonProtocol.ValidChains.SepoliaBase
        ].communityStake.toLowerCase(),
      event_signature: EvmEventSignatures.Contests.RecurringContestStarted,
      contract_name: ChildContractNames.RecurringContest,
      parent_contract_address:
        commonProtocol.factoryContracts[
          commonProtocol.ValidChains.SepoliaBase
        ].factory.toLowerCase(),
    },
  ]);

  return {
    evmEventSourceInstances,
  };
}

export const singleEventSource = {
  [commonProtocol.ValidChains.SepoliaBase]: {
    rpc: createTestRpc(commonProtocol.ValidChains.SepoliaBase),
    contracts: {
      [commonProtocol.factoryContracts[
        commonProtocol.ValidChains.SepoliaBase
      ].communityStake.toLowerCase()]: {
        abi: communityStakesAbi,
        sources: [
          {
            eth_chain_id: commonProtocol.ValidChains.SepoliaBase,
            event_signature: EvmEventSignatures.CommunityStake.Trade,
            contract_address:
              commonProtocol.factoryContracts[
                commonProtocol.ValidChains.SepoliaBase
              ].communityStake.toLowerCase(),
          },
        ],
      },
      [commonProtocol.factoryContracts[
        commonProtocol.ValidChains.SepoliaBase
      ].factory.toLowerCase()]: {
        abi: namespaceFactoryAbi,
        sources: [
          {
            eth_chain_id: commonProtocol.ValidChains.SepoliaBase,
            event_signature:
              EvmEventSignatures.NamespaceFactory.NamespaceDeployed,
            contract_address:
              commonProtocol.factoryContracts[
                commonProtocol.ValidChains.SepoliaBase
              ].factory.toLowerCase(),
          },
        ],
      },
    },
    maxBlockRange: -1,
  },
};

export const multipleEventSource = {
  ...singleEventSource,
  [commonProtocol.ValidChains.Base]: {
    rpc: createTestRpc(commonProtocol.ValidChains.Base),
    contracts: {
      [commonProtocol.factoryContracts[
        commonProtocol.ValidChains.Base
      ].communityStake.toLowerCase()]: {
        abi: communityStakesAbi,
        sources: [
          {
            eth_chain_id: commonProtocol.ValidChains.Base,
            event_signature: EvmEventSignatures.CommunityStake.Trade,
            contract_address:
              commonProtocol.factoryContracts[
                commonProtocol.ValidChains.Base
              ].communityStake.toLowerCase(),
          },
        ],
      },
      [commonProtocol.factoryContracts[
        commonProtocol.ValidChains.Base
      ].factory.toLowerCase()]: {
        abi: namespaceFactoryAbi,
        sources: [
          {
            eth_chain_id: commonProtocol.ValidChains.Base,
            event_signature:
              EvmEventSignatures.NamespaceFactory.NamespaceDeployed,
            contract_address:
              commonProtocol.factoryContracts[
                commonProtocol.ValidChains.Base
              ].factory.toLowerCase(),
          },
        ],
      },
    },
    maxBlockRange: -1,
  },
};
