'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        TRUNCATE TABLE "Memberships";
      `,
        {
          raw: true,
          type: 'RAW',
          transaction,
        },
      );
      await queryInterface.addColumn(
        'Memberships',
        'id',
        {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        {
          transaction,
        },
      );
      await queryInterface.addIndex('Memberships', {
        fields: ['address_id', 'group_id'],
        unique: true,
        transaction,
      });
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex(
        'Memberships',
        ['address_id', 'group_id'],
        { transaction },
      );
      await queryInterface.removeColumn('Memberships', 'id', { transaction });
    });
  },
};
