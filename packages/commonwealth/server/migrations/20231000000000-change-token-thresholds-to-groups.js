'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // add group_ids column to topics table
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'Topics',
        'group_ids',
        {
          type: Sequelize.ARRAY(Sequelize.INTEGER),
          allowNull: false,
          defaultValue: []
        },
        { transaction: t }
      )
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn(
        'Topics',
        'group_ids',
        { transaction }
      )
    })
  }
};
