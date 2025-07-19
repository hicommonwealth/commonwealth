import * as abis from '@commonxyz/common-protocol-abis';
import {
  CommunityStakeAbi,
  ContestGovernorSingleAbi,
  NamespaceFactoryAbi,
} from '@commonxyz/common-protocol-abis';
import { getFactoryContract, ValidChains } from '@hicommonwealth/evm-protocols';
import { createTestRpc } from '@hicommonwealth/model';
import { models } from '@hicommonwealth/model/db';
import { EvmEventSourceInstance } from '@hicommonwealth/model/models';
import { ChildContractNames } from '@hicommonwealth/schemas';
import { AbiType } from '@hicommonwealth/shared';
import { getAbiItem, toEventHash } from 'viem';

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
      event_signature: toEventHash(
        getAbiItem({
          abi: ContestGovernorSingleAbi,
          name: 'NewSingleContestStarted',
        })!,
      ),
      contract_name: ChildContractNames.SingleContest,
      parent_contract_address: getFactoryContract(ValidChains.SepoliaBase)
        .NamespaceFactory,
      created_at_block: 1,
      events_migrated: true,
    },
    {
      eth_chain_id: ethChainId,
      contract_address: recurringContestContractAddress,
      event_signature: toEventHash(
        getAbiItem({
          abi: abis.ContestGovernorAbi,
          name: 'NewRecurringContestStarted',
        })!,
      ),
      contract_name: ChildContractNames.RecurringContest,
      parent_contract_address: getFactoryContract(ValidChains.SepoliaBase)
        .NamespaceFactory,
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
      [getFactoryContract(
        ValidChains.SepoliaBase,
      ).CommunityStake.toLowerCase()]: {
        abi: CommunityStakeAbi,
        sources: [
          {
            eth_chain_id: ValidChains.SepoliaBase,
            event_signature: toEventHash(
              getAbiItem({
                abi: CommunityStakeAbi,
                name: 'Trade',
              })!,
            ),
            contract_address: getFactoryContract(
              ValidChains.SepoliaBase,
            ).CommunityStake.toLowerCase(),
          },
        ],
      },
      [getFactoryContract(
        ValidChains.SepoliaBase,
      ).NamespaceFactory.toLowerCase()]: {
        abi: NamespaceFactoryAbi as unknown as AbiType,
        sources: [
          {
            eth_chain_id: ValidChains.SepoliaBase,
            event_signature: toEventHash(
              getAbiItem({
                abi: NamespaceFactoryAbi,
                name: 'DeployedNamespace',
              })!,
            ),
            contract_address: getFactoryContract(
              ValidChains.SepoliaBase,
            ).NamespaceFactory.toLowerCase(),
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
      [getFactoryContract(ValidChains.Base).CommunityStake.toLowerCase()]: {
        abi: CommunityStakeAbi,
        sources: [
          {
            eth_chain_id: ValidChains.Base,
            event_signature: toEventHash(
              getAbiItem({
                abi: CommunityStakeAbi,
                name: 'Trade',
              })!,
            ),
            contract_address: getFactoryContract(
              ValidChains.Base,
            ).CommunityStake.toLowerCase(),
          },
        ],
      },
      [getFactoryContract(ValidChains.Base).NamespaceFactory.toLowerCase()]: {
        abi: NamespaceFactoryAbi,
        sources: [
          {
            eth_chain_id: ValidChains.Base,
            event_signature: toEventHash(
              getAbiItem({
                abi: NamespaceFactoryAbi,
                name: 'DeployedNamespace',
              })!,
            ),
            contract_address: getFactoryContract(
              ValidChains.Base,
            ).NamespaceFactory.toLowerCase(),
          },
        ],
      },
    },
    maxBlockRange: -1,
  },
};
