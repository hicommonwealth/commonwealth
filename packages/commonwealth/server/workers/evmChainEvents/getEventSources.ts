import { logger } from '@hicommonwealth/core';
import {
  ContractSource,
  EventRegistry,
  commonProtocol as cp,
} from '@hicommonwealth/evm-protocols';
import {
  EvmContractSources,
  EvmEventSource,
  EvmSources,
  buildChainNodeUrl,
  models,
} from '@hicommonwealth/model';

const DEFAULT_MAX_BLOCK_RANGE = 500;

const log = logger(import.meta);

export async function getEventSources(): Promise<EvmSources> {
  const evmSources: EvmSources = {};

  const chainNodes = await models.ChainNode.scope('withPrivateData').findAll({
    where: {
      eth_chain_id: Object.keys(EventRegistry),
    },
  });
  const dbEvmSources = await models.EvmEventSource.findAll();

  for (const chainNode of chainNodes) {
    const ethChainId = chainNode.eth_chain_id!;
    if (!cp.isValidChain(ethChainId))
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
      const childContracts: ContractSource['childContracts'] =
        EventRegistry[ethChainId][source.parent_contract_address]
          ?.childContracts;
      if (!childContracts) {
        log.error(`Child contracts not found in Event Registry!`, undefined, {
          eth_chain_id: ethChainId,
          parent_contract_address: source.parent_contract_address,
        });
        continue;
      }

      if (!dbContractSources[source.contract_address]) {
        dbContractSources[source.contract_address] = [];
      }

      const sharedSource = {
        eth_chain_id: source.eth_chain_id,
        contract_address: source.contract_address,
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

      dbContractSources[source.contract_address].push(buildSource);
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
  return evmSources;
}
