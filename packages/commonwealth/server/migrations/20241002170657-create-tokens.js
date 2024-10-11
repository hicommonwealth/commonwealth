'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.createTable(
        'Tokens',
        {
          name: { type: Sequelize.STRING, primaryKey: true },
          icon_url: { type: Sequelize.STRING, allowNull: true },
          description: { type: Sequelize.STRING, allowNull: true },
          symbol: { type: Sequelize.STRING },
          chain_node_id: { type: Sequelize.INTEGER },
          base: { type: Sequelize.STRING, allowNull: false },
          created_at: { type: Sequelize.DATE, allowNull: false },
          updated_at: { type: Sequelize.DATE, allowNull: false },
          author_address: { type: Sequelize.STRING, allowNull: false },
        },
        {
          timestamps: true,
          transactions: t,
        },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('Tokens', { transaction });
    });
  },
};
