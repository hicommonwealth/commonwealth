import { commonProtocol } from '@hicommonwealth/evm-protocols';
import {
  communityStakesAbi,
  localRpc,
  namespaceFactoryAbi,
} from '@hicommonwealth/evm-testing';
import {
  ChainNodeInstance,
  ContractAbiInstance,
  EvmEventSourceInstance,
  hashAbi,
  models,
} from '@hicommonwealth/model';
import { BalanceType } from '@hicommonwealth/shared';

const namespaceDeployedSignature =
  '0x8870ba2202802ce285ce6bead5ac915b6dc2d35c8a9d6f96fa56de9de12829d5';
const communityStakeTradeSignature =
  '0xfc13c9a8a9a619ac78b803aecb26abdd009182411d51a986090f82519d88a89e';

export async function createEventSources(): Promise<{
  chainNodeInstance: ChainNodeInstance;
  namespaceAbiInstance: ContractAbiInstance;
  stakesAbiInstance: ContractAbiInstance;
  evmEventSourceInstances: EvmEventSourceInstance[];
}> {
  const chainNodeInstance = await models.ChainNode.create({
    url: localRpc,
    balance_type: BalanceType.Ethereum,
    name: 'Local Base Sepolia',
    eth_chain_id: commonProtocol.ValidChains.SepoliaBase,
    max_ce_block_range: -1,
  });
  const namespaceAbiInstance = await models.ContractAbi.create({
    abi: namespaceFactoryAbi,
    nickname: 'NamespaceFactory',
    abi_hash: hashAbi(namespaceFactoryAbi),
  });
  const stakesAbiInstance = await models.ContractAbi.create({
    abi: communityStakesAbi,
    nickname: 'CommunityStakes',
    abi_hash: hashAbi(communityStakesAbi),
  });
  const evmEventSourceInstances = await models.EvmEventSource.bulkCreate([
    {
      chain_node_id: chainNodeInstance.id!,
      contract_address:
        commonProtocol.factoryContracts[
          commonProtocol.ValidChains.SepoliaBase
        ].factory.toLowerCase(),
      event_signature: namespaceDeployedSignature,
      kind: 'DeployedNamespace',
      abi_id: namespaceAbiInstance.id!,
    },
    {
      chain_node_id: chainNodeInstance.id!,
      contract_address:
        commonProtocol.factoryContracts[
          commonProtocol.ValidChains.SepoliaBase
        ].communityStake.toLowerCase(),
      event_signature: communityStakeTradeSignature,
      kind: 'Trade',
      abi_id: stakesAbiInstance.id!,
    },
  ]);

  return {
    chainNodeInstance,
    namespaceAbiInstance,
    stakesAbiInstance,
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
