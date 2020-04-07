'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('OffchainReactions', 'object_id', 'thread_id');
    await queryInterface.changeColumn('OffchainReactions', 'thread_id', {
      type: Sequelize.STRING,
      allowNull: true,
      // references: { model: 'OffchainThreads', key: 'id' }
    });
    await queryInterface.addColumn('OffchainReactions', 'comment_id', {
      type: Sequelize.STRING,
      allowNull: true,
      // references: { model: 'OffchainComments', key: 'id' }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('OffchainReactions', 'comment_id', {
      type: Sequelize.STRING,
      allowNull: true,
      references: { model: 'OffchainComments', key: 'id' }
    });
    await queryInterface.changeColumn('OffchainReactions', 'thread_id', {
      type: Sequelize.STRING,
      allowNull: true,
      references: { }
    });
    await queryInterface.renameColumn('OffchainReactions', 'thread_id', 'object_id',);

  }
};
