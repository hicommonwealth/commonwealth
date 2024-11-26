import {
  ChildContractNames,
  commonProtocol,
  EvmEventSignatures,
} from '@hicommonwealth/evm-protocols';
import {
  communityStakesAbi,
  localRpc,
  namespaceFactoryAbi,
} from '@hicommonwealth/evm-testing';
import {
  buildChainNodeUrl,
  ChainNodeInstance,
  EvmEventSourceInstance,
  models,
} from '@hicommonwealth/model';
import { BalanceType } from '@hicommonwealth/shared';

const namespaceDeployedSignature =
  '0x8870ba2202802ce285ce6bead5ac915b6dc2d35c8a9d6f96fa56de9de12829d5';
const communityStakeTradeSignature =
  '0xfc13c9a8a9a619ac78b803aecb26abdd009182411d51a986090f82519d88a89e';

function createTestRpc(
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
  chainNodeInstance: ChainNodeInstance;
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

// creates evm sources for Stake on Ethereum Sepolia
export async function createAdditionalEventSources(
  namespaceAbiInstance: ContractAbiInstance,
  stakesAbiInstance: ContractAbiInstance,
): Promise<{
  chainNodeInstance: ChainNodeInstance;
  evmEventSourceInstances: EvmEventSourceInstance[];
}> {
  const chainNodeInstance = await models.ChainNode.create({
    url: 'http://localhost:8546',
    balance_type: BalanceType.Ethereum,
    name: 'Local Ethereum Sepolia',
    eth_chain_id: commonProtocol.ValidChains.Sepolia,
    max_ce_block_range: -1,
  });
  const evmEventSourceInstances = await models.EvmEventSource.bulkCreate([
    {
      chain_node_id: chainNodeInstance.id!,
      contract_address:
        commonProtocol.factoryContracts[
          commonProtocol.ValidChains.Sepolia
        ].factory.toLowerCase(),
      event_signature: namespaceDeployedSignature,
      kind: 'DeployedNamespace',
      abi_id: namespaceAbiInstance.id!,
    },
    {
      chain_node_id: chainNodeInstance.id!,
      contract_address:
        commonProtocol.factoryContracts[
          commonProtocol.ValidChains.Sepolia
        ].communityStake.toLowerCase(),
      event_signature: communityStakeTradeSignature,
      kind: 'Trade',
      abi_id: stakesAbiInstance.id!,
    },
  ]);

  return { chainNodeInstance, evmEventSourceInstances };
}

export const singleEventSource = {
  '1': {
    rpc: localRpc,
    contracts: {
      [commonProtocol.factoryContracts[
        commonProtocol.ValidChains.SepoliaBase
      ].communityStake.toLowerCase()]: {
        abi: communityStakesAbi,
        sources: [
          {
            id: 2,
            kind: 'Trade',
            abi_id: 2,
            active: true,
            chain_node_id: 1,
            event_signature: communityStakeTradeSignature,
            events_migrated: null,
            contract_address:
              commonProtocol.factoryContracts[
                commonProtocol.ValidChains.SepoliaBase
              ].communityStake.toLowerCase(),
            created_at_block: null,
          },
        ],
      },
      [commonProtocol.factoryContracts[
        commonProtocol.ValidChains.SepoliaBase
      ].factory.toLowerCase()]: {
        abi: namespaceFactoryAbi,
        sources: [
          {
            id: 1,
            kind: 'DeployedNamespace',
            abi_id: 1,
            active: true,
            chain_node_id: 1,
            event_signature: namespaceDeployedSignature,
            events_migrated: null,
            contract_address:
              commonProtocol.factoryContracts[
                commonProtocol.ValidChains.SepoliaBase
              ].factory.toLowerCase(),
            created_at_block: null,
          },
        ],
      },
    },
    maxBlockRange: -1,
  },
};

export const multipleEventSource = {
  ...singleEventSource,
  '2': {
    rpc: 'http://localhost:8546',
    contracts: {
      [commonProtocol.factoryContracts[
        commonProtocol.ValidChains.Sepolia
      ].factory.toLowerCase()]: {
        abi: namespaceFactoryAbi,
        sources: [
          {
            id: 3,
            kind: 'DeployedNamespace',
            abi_id: 1,
            active: true,
            chain_node_id: 2,
            event_signature: namespaceDeployedSignature,
            events_migrated: null,
            contract_address:
              commonProtocol.factoryContracts[
                commonProtocol.ValidChains.Sepolia
              ].factory.toLowerCase(),
            created_at_block: null,
          },
        ],
      },
      [commonProtocol.factoryContracts[
        commonProtocol.ValidChains.Sepolia
      ].communityStake.toLowerCase()]: {
        abi: communityStakesAbi,
        sources: [
          {
            id: 4,
            kind: 'Trade',
            abi_id: 2,
            active: true,
            chain_node_id: 2,
            event_signature: communityStakeTradeSignature,
            events_migrated: null,
            contract_address:
              commonProtocol.factoryContracts[
                commonProtocol.ValidChains.Sepolia
              ].communityStake.toLowerCase(),
            created_at_block: null,
          },
        ],
      },
    },
    maxBlockRange: -1,
  },
};
