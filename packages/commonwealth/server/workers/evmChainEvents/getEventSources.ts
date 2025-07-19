import { logger } from '@hicommonwealth/core';
import {
  ContractSource,
  EventRegistry,
  isValidChain,
} from '@hicommonwealth/evm-protocols';
import { buildChainNodeUrl } from '@hicommonwealth/model';
import { models } from '@hicommonwealth/model/db';
import type {
  EvmContractSources,
  EvmEventSource,
  EvmSources,
} from '@hicommonwealth/model/services';
import { getAddress } from 'viem';
import { config } from '../../config';

const DEFAULT_MAX_BLOCK_RANGE = 500;

const log = logger(import.meta);

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
      chainSource.contracts[contractAddress] = [];
    } else {
      const existingSource = chainSource.contracts[contractAddress].find(
        (s) => s.event_signature === source.event_signature,
      );
      if (existingSource && 'quest_action_meta_ids' in existingSource.meta) {
        existingSource.meta.quest_action_meta_ids?.push(
          source.quest_action_meta_id,
        );
        continue;
      }
    }

    chainSource.contracts[contractAddress].push({
      eth_chain_id: source.ChainNode!.eth_chain_id!,
      contract_address: contractAddress,
      event_signature: source.event_signature,
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

export async function getEventSources(): Promise<EvmSources> {
  const evmSources: EvmSources = {};

  let ethChainIds: string[] | number[] = Object.keys(EventRegistry);
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

  for (const chainNode of chainNodes) {
    const ethChainId = chainNode.eth_chain_id!;
    if (!isValidChain(ethChainId))
      throw new Error(`Invalid eth chain id ${ethChainId}`);

    const entries = Object.entries<ContractSource>(EventRegistry[ethChainId]);

    const registryContractSources: EvmContractSources = {};
    for (const [address, source] of entries) {
      registryContractSources[address] = source.eventSignatures.map(
        (signature) => ({
          eth_chain_id: ethChainId,
          contract_address: address,
          event_signature: signature,
          meta: {
            events_migrated: true,
          },
        }),
      );
    }

    const dbContractSources: EvmContractSources = {};
    for (const source of dbEvmSources.filter(
      (e) => e.eth_chain_id === ethChainId,
    )) {
      const parentContractAddress = getAddress(source.parent_contract_address);
      const contractAddress = getAddress(source.contract_address);
      const childContracts =
        EventRegistry[ethChainId][parentContractAddress]?.childContracts;
      if (!childContracts) {
        log.error(`Child contracts not found in Event Registry!`, undefined, {
          eth_chain_id: ethChainId,
          parent_contract_address: parentContractAddress,
        });
        continue;
      }

      if (!dbContractSources[contractAddress]) {
        dbContractSources[contractAddress] = [];
      }

      const sharedSource = {
        eth_chain_id: source.eth_chain_id,
        contract_address: contractAddress,
        event_signature: source.event_signature,
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

      dbContractSources[contractAddress].push(buildSource);
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
