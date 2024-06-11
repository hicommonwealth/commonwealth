'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
                DROP TABLE IF EXISTS entities_creation_events;
            `,
        { transaction: t, logging: console.log }
      );

      await queryInterface.addConstraint('ChainEntities', {
        fields: ['chain', 'type', 'type_id'],
        type: 'unique',
        transaction: t,
        logging: console.log,
      });
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
