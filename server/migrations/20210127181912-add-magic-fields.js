'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'Users', 'magicIssuer',
        { type: Sequelize.STRING, allowNull: true, },
        { transaction: t },
      );
      await queryInterface.addColumn(
        'Users', 'lastMagicLoginAt',
        { type: Sequelize.INTEGER, allowNull: true, },
        { transaction: t },
      );
      await queryInterface.addColumn(
        'Addresses', 'is_magic',
        { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        { transaction: t },
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('Users', 'magicIssuer', { transaction: t });
      await queryInterface.removeColumn('Users', 'lastMagicLoginAt', { transaction: t });
      await queryInterface.removeColumn('Addresses', 'is_magic', { transaction: t });
    });
  }
};
