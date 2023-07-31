'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      // some new-thread-creation subscriptions are missing a chain_id
      // creation of such subscriptions is no longer possible given the override create method in Subscriptions model
      await queryInterface.sequelize.query(
        `
        UPDATE "Subscriptions"
        SET chain_id = object_id
        WHERE category_id = 'new-thread-creation' AND chain_id IS NULL;
      `,
        { transaction: t }
      );

      await queryInterface.removeColumn('Subscriptions', 'object_id', {
        transaction: t,
      });
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Subscriptions', 'object_id', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
};
