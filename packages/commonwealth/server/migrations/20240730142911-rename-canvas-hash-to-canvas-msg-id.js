'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.renameColumn(
        'Threads',
        'canvas_hash',
        'canvas_msg_id',
        { transaction: t },
      );
      await queryInterface.renameColumn(
        'Comments',
        'canvas_hash',
        'canvas_msg_id',
        { transaction: t },
      );
      await queryInterface.renameColumn(
        'Reactions',
        'canvas_hash',
        'canvas_msg_id',
        { transaction: t },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.renameColumn(
        'Threads',
        'canvas_msg_id',
        'canvas_hash',
        { transaction: t },
      );
      await queryInterface.renameColumn(
        'Comments',
        'canvas_msg_id',
        'canvas_hash',
        { transaction: t },
      );
      await queryInterface.renameColumn(
        'Reactions',
        'canvas_msg_id',
        'canvas_hash',
        { transaction: t },
      );
    });
  },
};
