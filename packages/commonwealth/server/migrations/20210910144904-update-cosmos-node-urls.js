'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkUpdate(
        'ChainNodes',
        {
          url: 'https://osmosis-rpc.cw-figment.workers.dev',
        },
        {
          chain: 'osmosis',
        },
        {
          transaction: t,
        }
      );
      await queryInterface.bulkUpdate(
        'Chains',
        {
          active: false,
        },
        {
          id: 'straightedge',
        },
        {
          transaction: t,
        }
      );
      await queryInterface.bulkUpdate(
        'ChainNodes',
        {
          url: 'https://injective-rpc.cw-figment.workers.dev',
        },
        {
          chain: 'injective',
        },
        {
          transaction: t,
        }
      );
      await queryInterface.bulkUpdate(
        'ChainNodes',
        {
          url: 'https://terra-rpc.cw-figment.workers.dev',
        },
        {
          chain: 'terra',
        },
        {
          transaction: t,
        }
      );
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkUpdate(
        'ChainNodes',
        {
          url: 'https://lcd-osmosis.keplr.app',
        },
        {
          chain: 'osmosis',
        },
        {
          transaction: t,
        }
      );
      await queryInterface.bulkUpdate(
        'Chains',
        {
          active: true,
        },
        {
          id: 'straightedge',
        },
        {
          transaction: t,
        }
      );
      await queryInterface.bulkUpdate(
        'ChainNodes',
        {
          url: 'https://injective.cw-figment.workers.dev',
        },
        {
          chain: 'injective',
        },
        {
          transaction: t,
        }
      );
      await queryInterface.bulkUpdate(
        'ChainNodes',
        {
          url: 'https://terra.cw-figment.workers.dev',
        },
        {
          chain: 'terra',
        },
        {
          transaction: t,
        }
      );
    });
  },
};
