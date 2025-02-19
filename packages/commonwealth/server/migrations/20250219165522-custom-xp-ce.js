'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ChainEventXpSources', {
      chain_node_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: { model: 'ChainNodes', key: 'id' },
      },
      contract_address: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
      event_signatures: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
      quest_action_meta_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: { model: 'QuestActionMetas', key: 'id' },
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ChainEventXpSources');
  },
};
