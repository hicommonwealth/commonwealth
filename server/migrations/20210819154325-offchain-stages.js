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
        chain_id: { type: Sequelize.STRING, allowNull: true },
        community_id: { type: Sequelize.STRING, allowNull: true },
        featured_in_sidebar: { type: Sequelize.BOOLEAN, allowNull: true, defaultValue: false },
        featured_in_new_post: { type: Sequelize.BOOLEAN, allowNull: true, defaultValue: false },
      });
      const stages = [];
      const [chains] = await queryInterface.sequelize.query('SELECT * FROM "Chains";');
      if (chains && chains.length) {
        for (const chain of chains) {
          const arr = parseCustomStages(chain.customStages);
          arr.forEach((stage) => {
            stages.push({
              name: stage,
              chain_id: chain.id
            });
          });
        }
      }
      const [communities] = await queryInterface.sequelize.query('SELECT * FROM "OffchainCommunities";');
      if (communities && communities.length) {
        for (const community of communities) {
          const arr = parseCustomStages(community.customStages);
          arr.forEach((stage) => {
            stages.push({
              name: stage,
              community_id: community.id
            });
          });
        }
      }
      await queryInterface.bulkInsert('OffchainStages', stages);
      return new Promise((resolve, reject) => resolve());
    } catch (e) {
      return new Promise((resolve, reject) => reject(e));
    }
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable('OffchainStages');
  }
};
