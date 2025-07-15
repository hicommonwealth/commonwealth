'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Topics', 'token_threshold');
  },

  down: async (queryInterface, Sequelize) => {
    // data loss occurs
    await queryInterface.addColumn(
      'Topics',
      'token_threshold',
      {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: '0',
      },
      { transaction: t },
    );
  },
};
