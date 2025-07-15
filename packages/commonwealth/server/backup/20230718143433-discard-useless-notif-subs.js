'use strict';

const { QueryTypes } = require('sequelize');
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addIndex('Subscriptions', ['subscriber_id'], {
        name: 'subscriptions_subscriber_id',
        transaction: t,
      });

      await queryInterface.removeConstraint(
        'NotificationsRead',
        'NotificationsRead_subscription_id_fkey',
        {
          transaction: t,
        }
      );

      await queryInterface.removeConstraint(
        'NotificationsRead',
        'NotificationsRead_notification_id_fkey',
        {
          transaction: t,
        }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeIndex(
        'Subscriptions',
        'subscriptions_subscriber_id',
        { transaction: t }
      );

      await queryInterface.addConstraint('NotificationsRead', {
        fields: ['subscription_id'],
        type: 'foreign key',
        name: 'NotificationsRead_subscription_id_fkey',
        references: {
          table: 'Subscriptions',
          field: 'id',
        },
        transaction: t,
      });

      await queryInterface.addConstraint('NotificationsRead', {
        fields: ['notification_id'],
        type: 'foreign key',
        name: 'NotificationsRead_notification_id_fkey',
        references: {
          table: 'Notifications',
          field: 'id',
        },
        transaction: t,
      });
    });
  },
};
