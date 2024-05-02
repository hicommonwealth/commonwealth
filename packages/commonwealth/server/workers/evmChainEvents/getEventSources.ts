import type { DB } from '@hicommonwealth/model';
import { QueryTypes } from 'sequelize';
import { EvmSources } from './types';

export async function getEventSources(models: DB): Promise<EvmSources> {
  const result = await models.sequelize.query<{ aggregate: EvmSources }>(
    `
    WITH EventSourcesAgg AS (
        SELECT
            ESS.chain_node_id,
            ESS.contract_address,
            ESS.abi_id,
            json_agg(row_to_json(ESS)) AS sources -- Aggregate event sources for each contract address
        FROM "EvmEventSources" ESS
        WHERE active = true
        GROUP BY ESS.contract_address, ESS.abi_id, ESS.chain_node_id
    ), ContractsAgg AS (
        SELECT
            ESA.chain_node_id,
            jsonb_object_agg(
                ESA.contract_address,
                jsonb_build_object(
                    'abi', CA.abi,
                    'sources', ESA.sources
                )
            ) AS contracts
        FROM EventSourcesAgg ESA
        JOIN "ContractAbis" CA ON CA.id = ESA.abi_id
        GROUP BY ESA.chain_node_id
    ), ChainNodesAgg AS (
        SELECT
            CN.id AS chain_node_id,
            COALESCE(CN.private_url, CN.url) AS rpc,
            CA.contracts
        FROM "ChainNodes" CN
        JOIN ContractsAgg CA ON CN.id = CA.chain_node_id
    )
    SELECT jsonb_object_agg(chain_node_id, jsonb_build_object('rpc', rpc, 'contracts', contracts)) as aggregate
    FROM ChainNodesAgg;
  `,
    { raw: true, type: QueryTypes.SELECT },
  );

  if (result.length > 0) {
    return result[0].aggregate;
  }

  return {};
}
