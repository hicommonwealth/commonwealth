'use strict';

function parseCustomStages(str) {
  // Parse customStages into a `string[]`
  // If parsing fails, return an empty array.
  let arr;
  try {
    arr = Array.from(JSON.parse(str));
  } catch (e) {
    return [];
  }
  return arr.reduce((acc, current) => current ? [...acc, current.toString()] : acc, []);
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.createTable('OffchainStages', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        name: { type: Sequelize.STRING, allowNull: false },
        description: { type: Sequelize.STRING, allowNull: true },
        chain_id: { type: Sequelize.STRING, allowNull: true },
        community_id: { type: Sequelize.STRING, allowNull: true },
        featured_in_sidebar: { type: Sequelize.BOOLEAN, allowNull: true, defaultValue: false },
        featured_in_new_post: { type: Sequelize.BOOLEAN, allowNull: true, defaultValue: false },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
        deleted_at: Sequelize.DATE,
      });
      const stages = [];
      const [chains] = await queryInterface.sequelize.query('SELECT * FROM "Chains";');
      if (chains && chains.length) {
        for (const chain of chains) {
          const arr = parseCustomStages(chain.customStages);
          arr.forEach((stage) => {
            if (stages.findIndex((item) => item.name === stage && item.chain_id === chain.id) < 0) {
              stages.push({
                name: stage,
                chain_id: chain.id,
                created_at: new Date(),
                updated_at: new Date(),
              });
            }
          });
        }
      }
      const [communities] = await queryInterface.sequelize.query('SELECT * FROM "OffchainCommunities";');
      if (communities && communities.length) {
        for (const community of communities) {
          const arr = parseCustomStages(community.customStages);
          arr.forEach((stage) => {
            if (stages.findIndex((item) => item.name === stage && item.community_id === community.id) < 0) {
              stages.push({
                name: stage,
                community_id: community.id,
                created_at: new Date(),
                updated_at: new Date(),
              });
            }
          });
        }
      }
      const [threads] = await queryInterface.sequelize.query('SELECT id, chain, community, stage FROM "OffchainThreads";');
      if (threads && threads.length) {
        for (const thread of threads) {
          const { chain, community, stage } = thread;
          if (chain && stages.findIndex((item) => item.name === thread.stage && item.chain_id === chain) < 0) {
            stages.push({
              name: stage,
              chain_id: chain,
              created_at: new Date(),
              updated_at: new Date(),
            });
          }
          if (
            community && stages.findIndex((item) => item.name === thread.stage && item.community_id === community) < 0
          ) {
            stages.push({
              name: stage,
              community_id: community,
              created_at: new Date(),
              updated_at: new Date(),
            });
          }
        }
      }
      await queryInterface.bulkInsert('OffchainStages', stages);
      const threadsDefinition = await queryInterface.describeTable('OffchainThreads');
      if (!threadsDefinition.stage_id) {
        await queryInterface.addColumn('OffchainThreads', 'stage_id', {
          type: Sequelize.INTEGER,
          allowNull: true,
        });
      }
      if (threads && threads.length) {
        for (const thread of threads) {
          const index = stages.findIndex((item) => {
            if (item.name !== thread.stage) return false;
            if (thread.chain) return thread.chain === item.chain_id;
            return thread.community === item.community_id;
          });
          await queryInterface.bulkUpdate('OffchainThreads', {
            stage_id: index + 1,
          }, { id: thread.id });
        }
      }
      return new Promise((resolve, reject) => resolve());
    } catch (e) {
      return new Promise((resolve, reject) => reject(e));
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.dropTable('OffchainStages');
      await queryInterface.removeColumn('OffchainThreads', 'stage_id');
      return new Promise((resolve, reject) => resolve());
    } catch (e) {
      return new Promise((resolve, reject) => reject(e));
    }
  }
};
