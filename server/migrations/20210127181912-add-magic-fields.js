'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'User', 'magicIssuer',
        { type: Sequelize.STRING, allowNull: true, },
        { transaction: t },
      );
      await queryInterface.addColumn(
        'User', 'lastMagicLoginAt',
        { type: Sequelize.INTEGER, allowNull: true, },
        { transaction: t },
      );
      await queryInterface.addColumn(
        'Address', 'is_magic',
        { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        { transaction: t },
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('User', 'magicIssuer', { transaction: t });
      await queryInterface.removeColumn('User', 'lastMagicLoginAt', { transaction: t });
      await queryInterface.removeColumn('Address', 'is_magic', { transaction: t });
    });
  }
};
