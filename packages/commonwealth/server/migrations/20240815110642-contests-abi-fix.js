'use strict';

const { QueryTypes } = require('sequelize');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Get old namespace factory ABI
      const [oldResult] = await queryInterface.sequelize.query(
        `
          SELECT id FROM "ContractAbis" WHERE nickname = 'NamespaceFactory'
        `,
      );
      const oldContractAbiId = oldResult[0]?.id;
      if (!oldContractAbiId) {
        throw new Error('Failed to get old contract ABI ID');
      }

      // Get new namespace factory ABI
      const [newResult] = await queryInterface.sequelize.query(
        `
          SELECT id FROM "ContractAbis" WHERE nickname = 'NamespaceFactoryForContests'
        `,
      );
      const contractAbiId = newResult[0]?.id;
      if (!contractAbiId) {
        throw new Error('Failed to get new contract ABI ID');
      }

      // Update old EVM event sources to use new namespace factory ABI
      await queryInterface.sequelize.query(
        `
        UPDATE "EvmEventSources"
        SET abi_id = :contractAbiId
        WHERE abi_id = :oldContractAbiId
        `,
        {
          replacements: { contractAbiId, oldContractAbiId },
          transaction,
        },
      );

      // Delete old ABI
      await queryInterface.sequelize.query(
        `
        DELETE FROM "ContractAbis" WHERE nickname = 'NamespaceFactory'
        `,
        { transaction },
      );

      // Rename new ABI to old name
      await queryInterface.sequelize.query(
        `
        UPDATE "ContractAbis" SET nickname = 'NamespaceFactory' WHERE nickname = 'NamespaceFactoryForContests'
        `,
        { transaction },
      );

      // Fix broken contest managers (that have no Contests) by emitting the outbox event
      // which will trigger the policy to create EvmEventSources
      const [contestManagers] = await queryInterface.sequelize.query(
        `
          SELECT cm.contest_address, cm.community_id, cm.interval
          FROM "ContestManagers" cm
          LEFT JOIN "Contests" c
          ON cm.contest_address = c.contest_address
          WHERE c.contest_address IS NULL;
        `,
        { transaction },
      );

      for (const {
        community_id,
        contest_address,
        interval,
      } of contestManagers) {
        const [community] = await queryInterface.sequelize.query(
          `SELECT namespace_address FROM "Communities" c WHERE c.id = :community_id`,
          {
            replacements: { community_id },
            type: QueryTypes.SELECT,
          },
        );
        if (!community.namespace_address) {
          throw new Error(`no namespace for community: ${community_id}`);
        }
        const event = {
          event_name:
            interval === 0
              ? 'OneOffContestManagerDeployed'
              : 'RecurringContestManagerDeployed',
          event_payload: {
            interval,
            contest_address,
            namespace: community.namespace_address,
          },
        };
        await queryInterface.sequelize.query(
          `INSERT INTO "Outbox" (event_name, event_payload, created_at, updated_at) VALUES (:event_name, :event_payload, NOW(), NOW())`,
          {
            replacements: {
              event_name: event.event_name,
              event_payload: JSON.stringify(event.event_payload),
            },
            type: queryInterface.sequelize.QueryTypes.INSERT,
          },
        );
      }
    });
  },

  // Migration not reversible
  async down(queryInterface, Sequelize) {
    // This migration is not reversible. If you need to reverse it, please handle it manually.
  },
};
