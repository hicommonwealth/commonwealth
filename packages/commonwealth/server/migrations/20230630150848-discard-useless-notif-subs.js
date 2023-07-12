'use strict';

const { QueryTypes } = require('sequelize');
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addIndex('Subscriptions', ['subscriber_id'], {
      name: 'subscriptions_subscriber_id',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex(
      'Subscriptions',
      'subscriptions_subscriber_id'
    );
  },
};
