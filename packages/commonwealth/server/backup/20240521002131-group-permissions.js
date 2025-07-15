'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable(
      'GroupPermissions',
      {
        group_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'Groups',
            key: 'id',
          },
          primaryKey: true,
        },
        allowed_actions: {
          type: Sequelize.ARRAY(
            Sequelize.ENUM(
              'CREATE_THREAD',
              'CREATE_COMMENT',
              'CREATE_THREAD_REACTION',
              'CREATE_COMMENT_REACTION',
              'UPDATE_POLL',
            ),
          ),
          allowNull: false,
        },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
      },
      {
        timestamps: true,
      },
    );
  },

  async down(queryInterface, _) {
    return queryInterface.dropTable('GroupPermissions');
  },
};
