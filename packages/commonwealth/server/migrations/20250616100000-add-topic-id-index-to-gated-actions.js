'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addIndex('GroupGatedActions', {
        fields: ['topic_id'],
        name: 'groupgatedactions_topic_id',
        transaction,
      });
    });
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex(
        'GroupGatedActions',
        'groupgatedactions_topic_id',
        { transaction },
      );
    });
  },
};
