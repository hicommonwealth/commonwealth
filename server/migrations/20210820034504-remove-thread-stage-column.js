'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('OffchainThreads', 'stage');
  },

  down: async (queryInterface, Sequelize) => {
    const [threads] = await queryInterface.sequelize.query('SELECT id, chain, community, stage_id FROM "OffchainThreads";');
    if (threads && threads.length) {
      for (const thread of threads) {
        const [stage] = await queryInterface.sequelize.query(`SELECT id, name FROM "OffchainStages" WHERE id=${thread.stage_id};`);
        await queryInterface.bulkUpdate('OffchainThreads', {
          stage: stage.name,
        }, { id: thread.id });
      }
    }
  }
};
