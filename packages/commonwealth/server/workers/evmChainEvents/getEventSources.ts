import { QueryTypes } from 'sequelize';
import models from '../../database';
import { ChainNodeAttributes } from '../../models/chain_node';
import { ContractAttributes } from '../../models/contract';
import { ContractAbiAttributes } from '../../models/contract_abi';
import { EvmEventSourceAttributes } from '../../models/evmEventSource';
import { EvmSources } from './types';

/**
 * Returns a mapping of RPC URLs to contract addresses to event sources and ABIs. This function is the most likely
 * to change as we move towards multi-contract communities and refactor from a chain-centric to a community-centric
 * model.
 */
export async function getEventSources(): Promise<EvmSources> {
  // fetch ABIs first to reduce memory footprint since ABIs can be quite large and joining them
  // with EvmEventSources can be expensive if they are duplicated multiple times
  const abis: {
    contract_address: ContractAttributes['address'];
    chain_node_id: ContractAttributes['chain_node_id'];
    abi: ContractAbiAttributes['abi'];
    url: ChainNodeAttributes['url'];
    private_url: ChainNodeAttributes['private_url'];
  }[] = await models.sequelize.query(
    `
      WITH sub_chains AS (SELECT DISTINCT(S.chain_id)
                          FROM "Subscriptions" S
                          WHERE S.category_id = 'chain-event')
      SELECT C.address as contract_address, C.chain_node_id, CA.abi, CN.url, CN.private_url
      FROM "CommunityContracts" CC
               JOIN "Contracts" C on CC.contract_id = C.id
               JOIN "ContractAbis" CA ON CA.id = C.abi_id
               JOIN "ChainNodes" CN ON CN.id = C.chain_node_id
      WHERE CC.community_id IN (SELECT chain_id FROM sub_chains);
  `,
    { type: QueryTypes.SELECT, raw: true },
  );

  if (abis.length === 0) {
    return {};
  }

  const eventSources: Omit<
    EvmEventSourceAttributes,
    'id' | 'ChainNode' | 'Contract'
  >[] = await models.sequelize.query(
    `
    SELECT EES.contract_address, EES.chain_node_id, EES.event_signature, EES.kind
    FROM "EvmEventSources" EES
    WHERE (EES.contract_address, EES.chain_node_id)
            IN (?);
  `,
    {
      type: QueryTypes.SELECT,
      raw: true,
      replacements: [abis.map((a) => [a.contract_address, a.chain_node_id])],
    },
  );

  const evmSources: EvmSources = {};
  for (const eventSource of eventSources) {
    const chainNodeId = eventSource.chain_node_id;
    const contractAddress = eventSource.contract_address;

    if (!evmSources[chainNodeId]) {
      evmSources[chainNodeId] = {
        rpc: '',
        contracts: {},
      };
    }

    if (!evmSources[chainNodeId].contracts[contractAddress]) {
      evmSources[chainNodeId].contracts[contractAddress] = {
        abi: [],
        sources: [],
      };
    }

    evmSources[chainNodeId].contracts[contractAddress].sources.push({
      event_signature: eventSource.event_signature,
      kind: eventSource.kind,
    });
  }

  for (const abi of abis) {
    if (evmSources[abi.chain_node_id]) {
      evmSources[abi.chain_node_id].rpc = abi.private_url || abi.url;

      if (evmSources[abi.chain_node_id].contracts[abi.contract_address]) {
        evmSources[abi.chain_node_id].contracts[abi.contract_address].abi =
          abi.abi;
      }
    }
  }

  return evmSources;
}
