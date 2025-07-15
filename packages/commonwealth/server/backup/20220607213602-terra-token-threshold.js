'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkUpdate(
        'ChainNodes',
        {
          url: 'https://lcd.phoenix.terra.setten.io/5e351408cfc5460186aa77ff1f38fac9',
        },
        {
          url: 'https://terra-rpc.cw-figment.workers.dev',
        },
        {
          transaction,
        }
      );
      await queryInterface.bulkUpdate(
        'Chains',
        {
          decimals: 6,
        },
        {
          id: 'terra',
        },
        {
          transaction,
        }
      );
      await queryInterface.bulkUpdate(
        'Chains',
        {
          type: 'token',
        },
        {
          id: 'terra',
        },
        {
          transaction,
        }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkUpdate(
        'ChainNodes',
        {
          url: 'https://terra-rpc.cw-figment.workers.dev',
        },
        {
          url: 'https://lcd.phoenix.terra.setten.io/5e351408cfc5460186aa77ff1f38fac9',
        },
        {
          transaction,
        }
      );
      await queryInterface.bulkUpdate(
        'Chains',
        {
          decimals: 9,
        },
        {
          id: 'terra',
        },
        {
          transaction,
        }
      );
      await queryInterface.bulkUpdate(
        'Chains',
        {
          type: 'chain',
        },
        {
          id: 'terra',
        },
        {
          transaction,
        }
      );
    });
  },
};
