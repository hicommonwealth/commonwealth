'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn('Profiles', 'socials', {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true
      }, { transaction: t });
      await queryInterface.removeColumn('Profiles', 'github', { transaction: t });
      await queryInterface.removeColumn('Profiles', 'twitter', { transaction: t });
      await queryInterface.removeColumn('Profiles', 'discord', { transaction: t });
      await queryInterface.removeColumn('Profiles', 'telegram', { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('Profiles', 'socials', { transaction: t });
      await queryInterface.addColumn('Profiles', 'github', {
        type: Sequelize.STRING,
        allowNull: true
      }, { transaction: t });
      await queryInterface.addColumn('Profiles', 'twitter', {
        type: Sequelize.STRING,
        allowNull: true
      }, { transaction: t });
      await queryInterface.addColumn('Profiles', 'discord', {
        type: Sequelize.STRING,
        allowNull: true
      }, { transaction: t });
      await queryInterface.addColumn('Profiles', 'telegram', {
        type: Sequelize.STRING,
        allowNull: true
      }, { transaction: t });
    });
  }
};
