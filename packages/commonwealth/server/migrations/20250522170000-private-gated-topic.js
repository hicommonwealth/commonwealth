'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // add is_private column to GroupGatedActions
      await queryInterface.addColumn('GroupGatedActions', 'is_private', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        transaction,
      });

      // add GatedThreads view to join gated actions
      await queryInterface.sequelize.query(
        `
CREATE OR REPLACE VIEW "GatedThreads" AS
SELECT
  t.*, a.address as gated_address
FROM
  "Threads" t
  LEFT JOIN "GroupGatedActions" ga ON t.topic_id = ga.topic_id AND ga.is_private = true 
  LEFT JOIN "Memberships" m ON ga.group_id = m.group_id AND m.reject_reason IS NULL
  LEFT JOIN "Addresses" a ON m.address_id = a.id;
    `,
        { transaction },
      );
    });
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('GroupGatedActions', 'is_private');
      await queryInterface.sequelize.query(`DROP VIEW "GatedThreads";`, {
        transaction,
      });
    });
  },
};
