'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // create temp tables
      await queryInterface.sequelize.query(
        `
          CREATE TEMPORARY TABLE delete_contracts AS
          SELECT CC.id as community_contract_id, C.id as contract_id, C.abi_id, C.address, C.chain_node_id, CC.community_id
          FROM "CommunityContracts" CC
                   JOIN "Contracts" C ON CC.contract_id = C.id
          WHERE community_id IN (SELECT id FROM "Communities" WHERE network IN ('aave', 'compound'));
      `,
        { transaction },
      );

      // Remove EvmEventSources
      await queryInterface.sequelize.query(
        `
          WITH sources AS (
              SELECT id
              FROM "EvmEventSources"
              WHERE (contract_address, chain_node_id) IN (SELECT address, chain_node_id FROM delete_contracts)
          )
          DELETE FROM "EvmEventSources"
          WHERE id IN (SELECT id FROM sources);
      `,
        { transaction },
      );

      // delete CommunityContracts, ContractAbis, and Contracts
      await queryInterface.sequelize.query(
        `
        DELETE FROM "CommunityContracts"
        WHERE id IN (SELECT community_contract_id FROM delete_contracts);

        DELETE FROM "Contracts"
        WHERE id IN (SELECT contract_id FROM delete_contracts);

        DELETE FROM "ContractAbis"
        WHERE id IN (SELECT abi_id FROM delete_contracts);
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        UPDATE "Communities"
        SET network = 'ethereum',
            type = 'offchain'
        WHERE id IN (SELECT community_id FROM delete_contracts);
      `,
        { transaction },
      );

      // remove proposal links in EVM communities
      await queryInterface.sequelize.query(
        `
            UPDATE "Threads" T
            SET "links" = (
                SELECT jsonb_agg(link)
                FROM jsonb_array_elements(T."links") AS link
                WHERE link ->> 'source' <> 'proposal'
            )
            FROM "Communities" C
            WHERE T.community_id = C.id
              AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(T."links") AS link
                WHERE link ->> 'source' = 'proposal'
            ) AND C.base = 'ethereum';
      `,
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {},
};
