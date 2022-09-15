'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
        await queryInterface.addColumn('Threads', 'signature', { type: Sequelize.STRING }, { transaction: t });
        await queryInterface.addColumn('Threads', 'signed_data', { type: Sequelize.TEXT }, { transaction: t });
        await queryInterface.addColumn('Threads', 'signed_hash', { type: Sequelize.STRING }, { transaction: t });

        await queryInterface.addColumn('Comments', 'signature', { type: Sequelize.STRING }, { transaction: t });
        await queryInterface.addColumn('Comments', 'signed_data', { type: Sequelize.TEXT }, { transaction: t });
        await queryInterface.addColumn('Comments', 'signed_hash', { type: Sequelize.STRING }, { transaction: t });

        await queryInterface.addColumn('Reactions', 'signature', { type: Sequelize.STRING }, { transaction: t });
        await queryInterface.addColumn('Reactions', 'signed_data', { type: Sequelize.TEXT }, { transaction: t });
        await queryInterface.addColumn('Reactions', 'signed_hash', { type: Sequelize.STRING }, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
        await queryInterface.removeColumn('Threads', 'signature', { transaction: t });
        await queryInterface.removeColumn('Threads', 'signed_data', { transaction: t });
        await queryInterface.removeColumn('Threads', 'signed_hash', { transaction: t });

        await queryInterface.removeColumn('Comments', 'signature', { transaction: t });
        await queryInterface.removeColumn('Comments', 'signed_data', { transaction: t });
        await queryInterface.removeColumn('Comments', 'signed_hash', { transaction: t });

        await queryInterface.removeColumn('Reactions', 'signature', { transaction: t });
        await queryInterface.removeColumn('Reactions', 'signed_data', { transaction: t });
        await queryInterface.removeColumn('Reactions', 'signed_hash', { transaction: t });
    });
  }
};
