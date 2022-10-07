'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'Chains',
        'chat_enabled',
        {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        { transcation: t }
      );

      await queryInterface.sequelize.query(
        `UPDATE "Chains" SET chat_enabled = 'f' WHERE id IN ('axie-infinity', 'terra');`,
        { transcation: t }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('Chains', 'chat_enabled');
  },
};
