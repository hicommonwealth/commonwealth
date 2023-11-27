'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn(
        'Webhooks',
        'chain_id',
        'community_id',
        {
          transaction,
        }
      );
      // remove webhooks that aren't associated with any community
      await queryInterface.sequelize.query(
        `
        DELETE FROM "Webhooks" W
        WHERE NOT EXISTS (
            SELECT id 
            FROM "Chains" C 
            WHERE C.id = W.community_id
        );
      `,
        { transaction }
      );
      await queryInterface.addConstraint('Webhooks', {
        type: 'FOREIGN KEY',
        fields: ['community_id'],
        name: 'Webhooks_community_id_fkey',
        references: {
          table: 'Chains',
          field: 'id',
        },
        transaction,
      });
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeConstraint(
        'Posts',
        'Webhooks_community_id_fkey',
        { transaction }
      );
      await queryInterface.renameColumn(
        'Webhooks',
        'community_id',
        'chain_id',
        {
          transaction,
        }
      );
    });
  },
};
