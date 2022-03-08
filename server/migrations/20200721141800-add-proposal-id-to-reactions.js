'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('OffchainReactions', 'proposal_id', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addIndex('OffchainReactions', {
      fields: [
        'chain',
        'address_id',
        'thread_id',
        'proposal_id',
        'comment_id',
        'reaction',
      ],
      unique: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('OffchainReactions', 'proposal_id', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    });
  },
};
