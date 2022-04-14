'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn('Profiles', 'avatarUrl', {
        type: Sequelize.STRING,
        allowNull: true
      }, { transaction: t });
      await queryInterface.addColumn('Profiles', 'slug', {
        type: Sequelize.STRING,
        allowNull: true
      }, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('Profiles', 'avatarUrl', {
        type: Sequelize.STRING,
        allowNull: true,
      }, { transaction: t });
      await queryInterface.removeColumn('Profiles', 'slug', {
        type: Sequelize.STRING,
        allowNull: true,
      }, { transaction: t });
    });
  }
};
