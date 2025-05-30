'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // using raw sql to avoid sequelize modeling views
      await queryInterface.sequelize.query(
        `DROP VIEW IF EXISTS "GatedThreads";`,
        {
          transaction,
        },
      );
      // add index to non rejected memberships
      await queryInterface.addIndex('Memberships', {
        fields: ['group_id', 'address_id'],
        where: { reject_reason: null },
        name: 'memberships_group_id_address_id_accepted',
        transaction,
      });
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex(
      'Memberships',
      'memberships_group_id_address_id_accepted',
    );
  },
};
