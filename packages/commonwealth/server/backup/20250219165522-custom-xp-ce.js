'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'ChainEventXpSources',
        {
          chain_node_id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            references: { model: 'ChainNodes', key: 'id' },
            onDelete: 'CASCADE',
          },
          contract_address: {
            type: Sequelize.STRING,
            primaryKey: true,
          },
          event_signature: {
            type: Sequelize.STRING,
            primaryKey: true,
          },
          quest_action_meta_id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            references: {
              model: 'QuestActionMetas',
              key: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          active: { type: Sequelize.BOOLEAN, allowNull: false },
          created_at: { type: Sequelize.DATE, allowNull: false },
          updated_at: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );
      await queryInterface.addIndex('QuestActionMetas', ['quest_id'], {
        transaction,
      });
      await queryInterface.addIndex('Quests', ['end_date'], { transaction });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('ChainEventXpSources');
      await queryInterface.removeIndex('QuestActionMetas', ['quest_id'], {
        transaction,
      });
      await queryInterface.removeIndex('Quests', ['end_date'], { transaction });
    });
  },
};
