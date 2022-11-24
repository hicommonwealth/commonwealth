import {QueryTypes} from "sequelize";
import models from '../database';

async function main() {
  console.log("Starting Query")
  const query = `
      WITH allChains AS (SELECT "Chains".id,
                                "Chains".substrate_spec,
                                "Chains".network,
                                "Chains".base,
                                "Chains".ce_verbose,
                                "ChainNodes".id                          as chain_node_id,
                                "ChainNodes".private_url,
                                "ChainNodes".url,
                                "Contracts".address,
                                ROW_NUMBER() OVER (ORDER BY "Chains".id) AS index
                         FROM "Chains"
                                  JOIN "ChainNodes" ON "Chains".chain_node_id = "ChainNodes".id
                                  LEFT JOIN "CommunityContracts" cc
                                            ON cc.chain_id = "Chains".id
                                  LEFT JOIN "Contracts"
                                            ON "Contracts".id = cc.contract_id
                         WHERE "Chains"."has_chain_events_listener" = true
                           AND ("Contracts".type IN ('marlin-testnet', 'aave', 'compound') OR
                                ("Chains".base = 'substrate' AND "Chains".type = 'chain')))
      SELECT allChains.id,
             allChains.substrate_spec,
             allChains.address                                                 as contract_address,
             allChains.network,
             allChains.base,
             allChains.ce_verbose                                              as verbose_logging,
             JSON_BUILD_OBJECT('id', allChains.chain_node_id, 'url',
                               COALESCE(allChains.private_url, allChains.url)) as "ChainNode"
      FROM allChains
      WHERE MOD(allChains.index, ${1}) = ${0};
  `;

  const result = await models.sequelize.query(
    query, {type: QueryTypes.SELECT, raw: true}
  );
  console.log(result);
  console.log("Execution Finished")
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
