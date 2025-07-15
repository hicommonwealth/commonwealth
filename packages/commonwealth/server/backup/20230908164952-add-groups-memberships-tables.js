'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.createTable(
        'Groups',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          chain_id: {
            type: Sequelize.STRING,
            allowNull: false,
            references: { model: 'Chains', key: 'id' },
          },
          metadata: { type: Sequelize.JSON, allowNull: false },
          requirements: { type: Sequelize.JSON, allowNull: false },

          created_at: { type: Sequelize.DATE, allowNull: false },
          updated_at: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction: t }
      );
      await queryInterface.createTable(
        'Memberships',
        {
          group_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'Groups', key: 'id' },
          },
          address_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'Addresses', key: 'id' },
          },
          reject_reason: { type: Sequelize.STRING, allowNull: true },
          last_checked: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction: t }
      );
    })
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addIndex(
        'Groups',
        { fields: ['chain_id'] },
        { transaction: t }
      );
      await queryInterface.addIndex(
        'Memberships',
        { fields: ['group_id'] },
        { transaction: t }
      );
      await queryInterface.addIndex(
        'Memberships',
        { fields: ['address_id'] },
        { transaction: t }
      );
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.dropTable('Memberships', { transaction: t })
      await queryInterface.dropTable('Groups', { transaction: t })
    })
  }
};
