'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      // Adding interval to Subscriptions
      await queryInterface.addColumn(
        'Subscriptions',
        'delivery_interval',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction: t }
      );

      // Creating DeliveryMechanism table
      await queryInterface.createTable(
        'DeliveryMechanisms',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          type: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          identifier: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          user_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          created_at: Sequelize.DATE,
          updated_at: Sequelize.DATE,
        },
        { transaction: t }
      );

      // Creating SubscriptionDelivery table
      await queryInterface.createTable(
        'SubscriptionDeliveries',
        {
          subscription_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          delivery_mechanism_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          created_at: Sequelize.DATE,
          updated_at: Sequelize.DATE,
        },
        { transaction: t }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      // Reverting changes
      await queryInterface.removeColumn('Subscriptions', 'delivery_interval', {
        transaction: t,
      });
      await queryInterface.dropTable('DeliveryMechanisms', { transaction: t });
      await queryInterface.dropTable('SubscriptionDeliveries', {
        transaction: t,
      });
    });
  },
};
