'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn('Chains', 'active', {
        type: DataTypes.BOOLEAN, defaultValue: false,
      }, { transaction: t });
      await queryInterface.addColumn('Users', 'emailVerified', {
        type: DataTypes.DATE, allowNull: true,
      }, { transaction: t });
    });
  },
  down: (queryInterface, DataTypes) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('Chains', 'active', { transaction: t });
      await queryInterface.removeColumn('Users', 'emailVerified', { transaction: t });
    })
  }
};
