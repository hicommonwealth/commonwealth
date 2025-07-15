'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'Threads',
        'canvas_action',
        { type: Sequelize.JSONB },
        { transaction: t }
      );
      await queryInterface.addColumn(
        'Threads',
        'canvas_session',
        { type: Sequelize.JSONB },
        { transaction: t }
      );
      await queryInterface.addColumn(
        'Threads',
        'canvas_hash',
        { type: Sequelize.STRING },
        { transaction: t }
      );

      await queryInterface.addColumn(
        'Comments',
        'canvas_action',
        { type: Sequelize.JSONB },
        { transaction: t }
      );
      await queryInterface.addColumn(
        'Comments',
        'canvas_session',
        { type: Sequelize.JSONB },
        { transaction: t }
      );
      await queryInterface.addColumn(
        'Comments',
        'canvas_hash',
        { type: Sequelize.STRING },
        { transaction: t }
      );

      await queryInterface.addColumn(
        'Reactions',
        'canvas_action',
        { type: Sequelize.JSONB },
        { transaction: t }
      );
      await queryInterface.addColumn(
        'Reactions',
        'canvas_session',
        { type: Sequelize.JSONB },
        { transaction: t }
      );
      await queryInterface.addColumn(
        'Reactions',
        'canvas_hash',
        { type: Sequelize.STRING },
        { transaction: t }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('Threads', 'canvas_action', {
        transaction: t,
      });
      await queryInterface.removeColumn('Threads', 'canvas_session', {
        transaction: t,
      });
      await queryInterface.removeColumn('Threads', 'canvas_hash', {
        transaction: t,
      });

      await queryInterface.removeColumn('Comments', 'canvas_action', {
        transaction: t,
      });
      await queryInterface.removeColumn('Comments', 'canvas_session', {
        transaction: t,
      });
      await queryInterface.removeColumn('Comments', 'canvas_hash', {
        transaction: t,
      });

      await queryInterface.removeColumn('Reactions', 'canvas_action', {
        transaction: t,
      });
      await queryInterface.removeColumn('Reactions', 'canvas_session', {
        transaction: t,
      });
      await queryInterface.removeColumn('Reactions', 'canvas_hash', {
        transaction: t,
      });
    });
  },
};
