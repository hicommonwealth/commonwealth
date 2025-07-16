import {
  CommunityStakeAbi,
  NamespaceFactoryAbi,
} from '@commonxyz/common-protocol-abis';
import {
  ChildContractNames,
  EvmEventSignatures,
  factoryContracts,
  ValidChains,
} from '@hicommonwealth/evm-protocols';
import { createTestRpc } from '@hicommonwealth/model';
import { models } from '@hicommonwealth/model/db';
import { EvmEventSourceInstance } from '@hicommonwealth/model/models';
import { AbiType } from '@hicommonwealth/shared';

export async function createContestEventSources(
  ethChainId: ValidChains,
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
        factoryContracts[ValidChains.SepoliaBase].factory,
      created_at_block: 1,
      events_migrated: true,
    },
    {
      eth_chain_id: ethChainId,
      contract_address: recurringContestContractAddress,
      event_signature: EvmEventSignatures.Contests.RecurringContestStarted,
      contract_name: ChildContractNames.RecurringContest,
      parent_contract_address:
        factoryContracts[ValidChains.SepoliaBase].factory,
      created_at_block: 1,
      events_migrated: true,
    },
  ]);

  return {
    evmEventSourceInstances,
  };
}

export const singleEventSource = {
  [ValidChains.SepoliaBase]: {
    rpc: createTestRpc(ValidChains.SepoliaBase),
    contracts: {
      [factoryContracts[ValidChains.SepoliaBase].communityStake.toLowerCase()]:
        {
          abi: CommunityStakeAbi,
          sources: [
            {
              eth_chain_id: ValidChains.SepoliaBase,
              event_signature: EvmEventSignatures.CommunityStake.Trade,
              contract_address:
                factoryContracts[
                  ValidChains.SepoliaBase
                ].communityStake.toLowerCase(),
            },
          ],
        },
      [factoryContracts[ValidChains.SepoliaBase].factory.toLowerCase()]: {
        abi: NamespaceFactoryAbi as unknown as AbiType,
        sources: [
          {
            eth_chain_id: ValidChains.SepoliaBase,
            event_signature:
              EvmEventSignatures.NamespaceFactory.NamespaceDeployed,
            contract_address:
              factoryContracts[ValidChains.SepoliaBase].factory.toLowerCase(),
          },
        ],
      },
    },
    maxBlockRange: -1,
  },
};

export const multipleEventSource = {
  ...singleEventSource,
  [ValidChains.Base]: {
    rpc: createTestRpc(ValidChains.Base),
    contracts: {
      [factoryContracts[ValidChains.Base].communityStake.toLowerCase()]: {
        abi: CommunityStakeAbi,
        sources: [
          {
            eth_chain_id: ValidChains.Base,
            event_signature: EvmEventSignatures.CommunityStake.Trade,
            contract_address:
              factoryContracts[ValidChains.Base].communityStake.toLowerCase(),
          },
        ],
      },
      [factoryContracts[ValidChains.Base].factory.toLowerCase()]: {
        abi: NamespaceFactoryAbi,
        sources: [
          {
            eth_chain_id: ValidChains.Base,
            event_signature:
              EvmEventSignatures.NamespaceFactory.NamespaceDeployed,
            contract_address:
              factoryContracts[ValidChains.Base].factory.toLowerCase(),
          },
        ],
      },
    },
    maxBlockRange: -1,
  },
};
