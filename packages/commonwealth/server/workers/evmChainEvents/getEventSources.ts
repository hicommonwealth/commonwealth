import * as abis from '@commonxyz/common-protocol-abis';
import { logger } from '@hicommonwealth/core';
import { factoryContracts, isValidChain } from '@hicommonwealth/evm-protocols';
import { buildChainNodeUrl, extractPolicyKeys } from '@hicommonwealth/model';
import { models } from '@hicommonwealth/model/db';
import { ChildContractNames, Events } from '@hicommonwealth/schemas';
import { Abi, getAbiItem, getAddress, toEventHash } from 'viem';
import { config } from '../../config';

const DEFAULT_MAX_BLOCK_RANGE = 500;

const log = logger(import.meta);

export type EvmEventMeta = (
  | {
      events_migrated: true;
      quest_action_meta_ids?: number[];
    }
  | {
      events_migrated: false;
      created_at_block: number;
    }
) & { event_name?: Events };

export type EventSource = {
  event_signature: `0x${string}`;
  event_name: string;
  meta: EvmEventMeta;
};

export type EvmContractInfo = {
  event_sources: EventSource[];
  eth_chain_id: number;
  contract_address: string;
  contract_name: string;
  child_contracts?: ChildContracts;
  abi: Abi;
};

export type EvmContractSources = {
  [contractAddress: string]: EvmContractInfo;
};

type AbiGen = {
  [chainId: number]: EvmContractSources;
};

export type EvmChainSource = {
  rpc: string;
  maxBlockRange: number;
  contracts: EvmContractSources;
};

export type EvmEventSource = {
  event_signature: string;
  event_name: string;
  meta: EvmEventMeta;
};

export type EvmSources = {
  [ethChainId: string]: EvmChainSource;
};

export async function getXpSources(
  existingEvmSources: EvmSources,
): Promise<EvmSources> {
  const dbSources = await models.ChainEventXpSource.findAll({
    where: {
      active: true,
    },
    include: [
      {
        model: models.ChainNode.scope('withPrivateData'),
        required: true,
      },
    ],
  });

  const evmSources: EvmSources = {
    ...existingEvmSources,
  };
  for (const source of dbSources) {
    if (!evmSources[source.ChainNode!.eth_chain_id!]) {
      evmSources[source.ChainNode!.eth_chain_id!] = {
        rpc: source.ChainNode!.private_url || source.ChainNode!.url,
        maxBlockRange:
          source.ChainNode!.max_ce_block_range || DEFAULT_MAX_BLOCK_RANGE,
        contracts: {},
      };
    }

    const chainSource = evmSources[source.ChainNode!.eth_chain_id!];
    const contractAddress = getAddress(source.contract_address);
    if (!chainSource.contracts[contractAddress]) {
      chainSource.contracts[contractAddress] = { event_sources: [] };
    } else {
      const existingSource = chainSource.contracts[contractAddress][
        'event_sources'
      ].find((s) => s.event_signature === source.event_signature);
      if (existingSource && 'quest_action_meta_ids' in existingSource.meta) {
        existingSource.meta.quest_action_meta_ids?.push(
          source.quest_action_meta_id,
        );
        continue;
      }
    }

    chainSource.contracts[contractAddress]['event_sources'].push({
      eth_chain_id: source.ChainNode!.eth_chain_id!,
      contract_address: contractAddress,
      event_signature: source.event_signature,
      contract_name: 'ChainEventXpSource',
      event_name: 'XpChainEventCreated',
      meta: {
        events_migrated: true,
        quest_action_meta_ids: [source.quest_action_meta_id],
        event_name: 'XpChainEventCreated',
      },
    });
  }

  return evmSources;
}

let logWarning = true;

export type ChildContracts = {
  [K in keyof typeof abis]?: {
    [C in ChildContractNames]?: {
      abi: Abi;
      eventSignatures: string[];
    };
  };
};

const childContracts: ChildContracts = {
  NamespaceFactoryAbi: {
    [ChildContractNames.RecurringContest]: {
      abi: abis.ContestGovernorAbi,
      eventSignatures: [
        toEventHash(
          getAbiItem({ abi: abis.ContestGovernorAbi, name: 'ContentAdded' })!,
        ),
        toEventHash(
          getAbiItem({
            abi: abis.ContestGovernorAbi,
            name: 'NewRecurringContestStarted',
          })!,
        ),
        toEventHash(
          getAbiItem({ abi: abis.ContestGovernorAbi, name: 'VoterVoted' })!,
        ),
      ],
    },
    [ChildContractNames.SingleContest]: {
      abi: abis.ContestGovernorSingleAbi,
      eventSignatures: [
        toEventHash(
          getAbiItem({
            abi: abis.ContestGovernorSingleAbi,
            name: 'ContentAdded',
          })!,
        ),
        toEventHash(
          getAbiItem({
            abi: abis.ContestGovernorSingleAbi,
            name: 'NewSingleContestStarted',
          })!,
        ),
        toEventHash(
          getAbiItem({
            abi: abis.ContestGovernorSingleAbi,
            name: 'VoterVoted',
          })!,
        ),
      ],
    },
  },
};

// Parse out the events from all our protocol abis
export function cwProtocolSources(): AbiGen {
  return Object.fromEntries(
    Object.entries(factoryContracts).map(([_, contracts]) => {
      const { chainId, ...contractEntries } = contracts;

      const contractAddressToEvents: Record<string, EvmContractInfo> = {};

      for (const [contractName, contractAddress] of Object.entries(
        contractEntries,
      )) {
        const abiName = `${contractName}Abi`;
        const abi = (abis as any)[abiName] as Abi;

        if (!abi) throw new Error(`Missing ABI for contract: ${contractName}`);

        const event_sources = abi
          .filter((item) => item.type === 'event')
          .map((item) => ({
            event_signature: toEventHash(item),
            event_name: item.name!,
            meta: { events_migrated: true },
          }));

        contractAddressToEvents[contractAddress as `0x${string}`] = {
          contract_address: contractAddress as `0x${string}`,
          contract_name: contractName,
          eth_chain_id: chainId,
          abi,
          child_contracts: childContracts[abiName],
          event_sources: event_sources as unknown as EventSource[],
        };
      }

      return [chainId, contractAddressToEvents] as const;
    }),
  );
}

export async function getEventSources(): Promise<EvmSources> {
  const evmSources: EvmSources = {};

  let ethChainIds: string[] | number[] = Object.keys(factoryContracts);
  if (
    Array.isArray(config.EVM_CE.ETH_CHAIN_ID_OVERRIDE) &&
    config.EVM_CE.ETH_CHAIN_ID_OVERRIDE.length > 0 &&
    config.NODE_ENV !== 'test'
  ) {
    ethChainIds = config.EVM_CE.ETH_CHAIN_ID_OVERRIDE;
    if (logWarning) {
      log.warn(`Polling the following chain ids: ${ethChainIds.join(', ')}`);
      logWarning = false;
    }
  }

  const chainNodes = await models.ChainNode.scope('withPrivateData').findAll({
    where: {
      eth_chain_id: ethChainIds,
    },
  });

  const dbEvmSources = await models.EvmEventSource.findAll();
  const autogennedSources = cwProtocolSources();

  const temp = extractPolicyKeys();

  for (const chainNode of chainNodes) {
    const ethChainId = chainNode.eth_chain_id!;
    if (!isValidChain(ethChainId))
      throw new Error(`Invalid eth chain id ${ethChainId}`);

    const registryContractSources: EvmContractSources =
      autogennedSources[ethChainId] ?? {};

    const dbContractSources: EvmContractSources = {};
    for (const source of dbEvmSources.filter(
      (e) => e.eth_chain_id === ethChainId,
    )) {
      const parentContractAddress = getAddress(source.parent_contract_address);
      const contractAddress = getAddress(source.contract_address);
      const childContract =
        registryContractSources[parentContractAddress].child_contracts;
      if (!childContract) {
        log.error(`Child contracts not found in Event Registry!`, undefined, {
          eth_chain_id: ethChainId,
          parent_contract_address: parentContractAddress,
        });
        continue;
      }

      const sharedSource = {
        eth_chain_id: source.eth_chain_id,
        contract_address: contractAddress,
        event_signature: source.event_signature,
        contract_name: source.contract_name,
        event_name: 'EvmEventSource',
      };
      let buildSource: EvmEventSource;
      if (source.events_migrated === true) {
        buildSource = {
          ...sharedSource,
          meta: {
            events_migrated: source.events_migrated,
          },
        };
      } else {
        buildSource = {
          ...sharedSource,
          meta: {
            events_migrated: source.events_migrated!,
            created_at_block: source.created_at_block,
          },
        };
      }

      dbContractSources[contractAddress]['event_sources'].push(buildSource);
    }

    evmSources[ethChainId] = {
      rpc: buildChainNodeUrl(chainNode.private_url || chainNode.url, 'private'),
      maxBlockRange: chainNode.max_ce_block_range || DEFAULT_MAX_BLOCK_RANGE,
      contracts: {
        ...registryContractSources,
        ...dbContractSources,
      },
    };
  }

  return getXpSources(evmSources);
}
