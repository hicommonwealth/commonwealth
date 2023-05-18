'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'ChainEvents',
        'contract_address',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction: t }
      );

      await queryInterface.sequelize.query(
        `
      
      `,
        { transaction: t }
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
  },
};
