'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'Chains',
        'base',
        { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
        { transaction: t }
      );
      await queryInterface.addColumn(
        'Chains',
        'ss58_prefix',
        { type: Sequelize.INTEGER, allowNull: true },
        { transaction: t }
      );

      // populate columns for all extant chains
      await queryInterface.bulkUpdate(
        'Chains',
        { base: 'ethereum' },
        { id: 'ethereum' },
        { transaction: t }
      );
      await queryInterface.bulkUpdate(
        'Chains',
        { base: 'substrate', ss58_prefix: 7 },
        { id: 'edgeware-testnet' },
        { transaction: t }
      );
      await queryInterface.bulkUpdate(
        'Chains',
        { base: 'substrate', ss58_prefix: 36 },
        { id: 'centrifuge' },
        { transaction: t }
      );
      await queryInterface.bulkUpdate(
        'Chains',
        { base: 'substrate', ss58_prefix: 16 },
        { id: 'kulupu' },
        { transaction: t }
      );
      await queryInterface.bulkUpdate(
        'Chains',
        { base: 'substrate', ss58_prefix: 2 },
        { id: 'kusama' },
        { transaction: t }
      );
      await queryInterface.bulkUpdate(
        'Chains',
        { base: 'substrate', ss58_prefix: 5 },
        { id: 'plasm' },
        { transaction: t }
      );
      await queryInterface.bulkUpdate(
        'Chains',
        { base: 'ethereum' },
        { id: 'metacartel' },
        { transaction: t }
      );
      await queryInterface.bulkUpdate(
        'Chains',
        { base: 'substrate', ss58_prefix: 30 },
        { id: 'phala' },
        { transaction: t }
      );
      await queryInterface.bulkUpdate(
        'Chains',
        { base: 'substrate', ss58_prefix: 0 },
        { id: 'polkadot' },
        { transaction: t }
      );
      await queryInterface.bulkUpdate(
        'Chains',
        { base: 'near' },
        { id: 'near' },
        { transaction: t }
      );
      await queryInterface.bulkUpdate(
        'Chains',
        { base: 'cosmos' },
        { id: 'straightedge' },
        { transaction: t }
      );
      await queryInterface.bulkUpdate(
        'Chains',
        { base: 'substrate', ss58_prefix: 7 },
        { id: 'edgeware' },
        { transaction: t }
      );
      await queryInterface.bulkUpdate(
        'Chains',
        { base: 'substrate', ss58_prefix: 18 },
        { id: 'darwinia' },
        { transaction: t }
      );
      await queryInterface.bulkUpdate(
        'Chains',
        { base: 'substrate', ss58_prefix: 20 },
        { id: 'stafi' },
        { transaction: t }
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('Chains', 'base', { transaction: t });
      await queryInterface.removeColumn('Chains', 'ss58_prefix', {
        transaction: t,
      });
    });
  },
};
