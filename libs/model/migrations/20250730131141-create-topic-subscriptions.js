'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable('TopicSubscriptions', {
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          primaryKey: true,
          references: {
            model: 'Users',
            key: 'id',
          },
        },
        topic_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          primaryKey: true,
          references: {
            model: 'Topics',
            key: 'id',
          },
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
        },
      });

      await queryInterface.createIndex('TopicSubscriptions', 'topic_id', {
        transaction,
      });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TopicSubscriptions');
  },
};
