'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.renameTable('OffchainThreads', 'Threads', { transaction: t });
      await queryInterface.renameTable('OffchainComments', 'Comments', { transaction: t });
      await queryInterface.renameColumn('Subscriptions', 'offchain_thread_id', 'thread_id', { transaction: t });
      await queryInterface.renameColumn('Subscriptions', 'offchain_comment_id', 'comment_id', { transaction: t });
      await queryInterface.renameColumn('Collaborations', 'offchain_thread_id', 'thread_id', { transaction: t });
      /*
      await queryInterface.renameColumn('Comments', 'root_id', 'deprecated_root_id', { transaction: t });
      await queryInterface.addColumn('Comments', 'root_id', {
        type: Sequelize.INTEGER,
      });
      await queryInterface.addColumn('Threads', 'chain_entity_id', {
        type: Sequelize.INTEGER,
      });
      await queryInterface.sequelize.query(`
        INSERT INTO "Threads" ()
        SELECT  
        FROM "Comments"
          LEFT OUTER JOIN "Threads" ON;
      `, {transaction: t, raw: true, type: 'RAW'});
      await queryInterface.sequelize.query(`
        UPDATE "Comments" 
        SET root_id = 
        FROM "Comments";
      `, {transaction: t, raw: true, type: 'RAW'});
    */
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.renameTable('Threads', 'OffchainThreads', { transaction: t });
      await queryInterface.renameTable('Comments', 'OffchainComments', { transaction: t });
      await queryInterface.renameColumn('Subscriptions', 'thread_id', 'offchain_thread_id', { transaction: t });
      await queryInterface.renameColumn('Subscriptions', 'comment_id', 'offchain_comment_id', { transaction: t });
      await queryInterface.renameColumn('Collaborations', 'thread_id', 'offchain_thread_id', { transaction: t });
      /*
      await queryInterface.removeColumn('OffchainComments', 'root_id');
      await queryInterface.renameColumn('OffchainComments', 'deprecated_root_id', 'root_id', { transaction: t });
      await queryInterface.removeColumn('OffchainThreads', 'chain_entity_id');
      */
    });
  }
};
