'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // this migration is not transactionalized because each step depends on
    // prior steps for indexes/references/etc

    // initialize categories
    await queryInterface.createTable(
      'NotificationCategories',
      {
        name: { type: Sequelize.STRING, primaryKey: true },
        description: { type: Sequelize.TEXT, allowNull: false },
        created_at: { type: Sequelize.DATE, allowNull: true },
        updated_at: { type: Sequelize.DATE, allowNull: true },
      },
      {
        underscored: true,
      }
    );

    await queryInterface.bulkInsert('NotificationCategories', [
      {
        name: 'new-community-creation',
        description: 'someone makes a new community',
      },
      {
        name: 'new-thread-creation',
        description: 'someone makes a new thread',
      },
      {
        name: 'new-comment-creation',
        description: 'someone makes a new comment',
      },
    ]);

    // initialize subscriptions
    await queryInterface.createTable(
      'Subscriptions',
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        subscriber_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'Users', key: 'id' },
        },
        category_id: {
          type: Sequelize.STRING,
          allowNull: false,
          references: { model: 'NotificationCategories', key: 'name' },
        },
        object_id: { type: Sequelize.STRING, allowNull: false },
        is_active: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
          allowNull: false,
        },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
        deleted_at: { type: Sequelize.DATE },
      },
      {
        underscored: true,
        paranoid: true,
        indexes: [
          { fields: ['subscriber_id'] },
          { fields: ['category_id', 'object_id', 'is_active'] },
        ],
      }
    );

    // initialize notifications
    await queryInterface.createTable(
      'Notifications',
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        subscription_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'Subscriptions', key: 'id' },
        },
        notification_data: { type: Sequelize.TEXT, allowNull: false },
        is_read: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false,
        },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
      },
      {
        underscored: true,
        indexes: [{ fields: ['subscription_id'] }],
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.dropTable('Notifications', { transaction: t });
      await queryInterface.dropTable('Subscriptions', { transaction: t });
      await queryInterface.dropTable('NotificationCategories', {
        transaction: t,
      });
    });
  },
};
