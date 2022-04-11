'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      // add column
      await queryInterface.addColumn('Addresses', 'wallet_id', {
        type: Sequelize.STRING,
        allowNull: true,
      }, { transaction });

      // populate column for all but default eth addresses
      // update by base
      // TODO: base is on "chain" but not "address", need to figure out how to make that query
      await queryInterface.bulkUpdate('Addresses',
        { wallet_id: 'phantom' },
        { base: 'solana' },
        { transaction, });
      await queryInterface.bulkUpdate('Addresses',
        { wallet_id: 'near' },
        { base: 'near' },
        { transaction, });
      await queryInterface.bulkUpdate('Addresses',
        { wallet_id: 'polkadot' },
        { base: 'substrate' },
        { transaction, });
      await queryInterface.bulkUpdate('Addresses',
        { wallet_id: 'keplr' },
        { base: 'cosmos' },
        { transaction, });

      // update by network
      await queryInterface.bulkUpdate('Addresses',
        { wallet_id: 'ronin' },
        { network: 'axie-infinity' },
        { transaction, });
      await queryInterface.bulkUpdate('Addresses',
        { wallet_id: 'inj-metamask' },
        { network: 'injective' },
        { transaction, });
      await queryInterface.bulkUpdate('Addresses',
        { wallet_id: 'inj-metamask' },
        { network: 'injective-testnet' },
        { transaction, });
      await queryInterface.bulkUpdate('Addresses',
        { wallet_id: 'terrastation' },
        { network: 'terra' },
        { transaction, });

      // update for magic specifically
      await queryInterface.bulkUpdate('Addresses',
        { wallet_id: 'magic' },
        { is_magic: true },
        { transaction, });

      // drop is_magic field (use magic wallet instead)
      await queryInterface.removeColumn('Addresses', 'is_magic', { transaction });
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn('Addresses', 'is_magic', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      }, { transaction });

      // repopulate is_magic based on wallet_id === 'magic'
      await queryInterface.bulkUpdate('Addresses',
      { is_magic: true },
      { wallet_id: 'magic' },
      { transaction, });


      await queryInterface.removeColumn('Addresses', 'wallet_id', { transaction });
    });
  }
};
