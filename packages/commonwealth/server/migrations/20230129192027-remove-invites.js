'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('InviteCodes', { transaction });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'InviteCodes',
        {
          id: { type: Sequelize.STRING, primaryKey: true },
          chain_id: { type: Sequelize.STRING, allowNull: false },
          community_name: { type: Sequelize.STRING, allowNull: true },
          creator_id: { type: Sequelize.INTEGER, allowNull: false },
          invited_email: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: null,
          },
          used: {
            type: dataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          created_at: { type: Sequelize.DATE, allowNull: false },
          updated_at: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction }
      );
    });
  },
};
