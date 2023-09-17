'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
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
          enabled: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true,
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
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          subscription_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'Subscriptions',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          delivery_mechanism_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'DeliveryMechanisms',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
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
      await queryInterface.dropTable('SubscriptionDeliveries', {
        transaction: t,
      });
      await queryInterface.dropTable('DeliveryMechanisms', { transaction: t });
    });
  },
};
