'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'AICompletionTokens',
        {
          id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
          },
          token: {
            type: Sequelize.UUID,
            allowNull: false,
            unique: true,
            defaultValue: Sequelize.UUIDV4,
          },
          user_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'Users',
              key: 'id',
            },
            onDelete: 'CASCADE',
          },
          community_id: {
            type: Sequelize.STRING,
            allowNull: false,
            references: {
              model: 'Communities',
              key: 'id',
            },
            onDelete: 'CASCADE',
          },
          thread_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'Threads',
              key: 'id',
            },
            onDelete: 'CASCADE',
          },
          parent_comment_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
              model: 'Comments',
              key: 'id',
            },
            onDelete: 'CASCADE',
          },
          content: {
            type: Sequelize.TEXT,
            allowNull: false,
          },
          expires_at: {
            type: Sequelize.DATE,
            allowNull: false,
          },
          used_at: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
          },
        },
        { transaction },
      );

      // Create indexes
      await queryInterface.addIndex('AICompletionTokens', ['token'], {
        unique: true,
        transaction,
      });
      await queryInterface.addIndex('AICompletionTokens', ['user_id'], {
        transaction,
      });
      await queryInterface.addIndex('AICompletionTokens', ['expires_at'], {
        transaction,
      });
      await queryInterface.addIndex('AICompletionTokens', ['used_at'], {
        transaction,
      });
      await queryInterface.addIndex('AICompletionTokens', ['thread_id'], {
        transaction,
      });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('AICompletionTokens');
  },
};
