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
  createTestRpc,
  EvmEventSourceInstance,
  models,
} from '@hicommonwealth/model';

export async function createContestEventSources(
  ethChainId: commonProtocol.ValidChains,
  singleContestContractAddress: string,
  recurringContestContractAddress: string,
): Promise<{
  evmEventSourceInstances: EvmEventSourceInstance[];
}> {
  const evmEventSourceInstances = await models.EvmEventSource.bulkCreate([
    {
      eth_chain_id: ethChainId,
      contract_address: singleContestContractAddress,
      event_signature: EvmEventSignatures.Contests.SingleContestStarted,
      contract_name: ChildContractNames.SingleContest,
      parent_contract_address:
        commonProtocol.factoryContracts[commonProtocol.ValidChains.SepoliaBase]
          .factory,
    },
    {
      eth_chain_id: ethChainId,
      contract_address: recurringContestContractAddress,
      event_signature: EvmEventSignatures.Contests.RecurringContestStarted,
      contract_name: ChildContractNames.RecurringContest,
      parent_contract_address:
        commonProtocol.factoryContracts[commonProtocol.ValidChains.SepoliaBase]
          .factory,
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
