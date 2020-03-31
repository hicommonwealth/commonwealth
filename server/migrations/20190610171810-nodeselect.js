'use strict';

/**
 * We need to perform the following actions in this migration to add node selection:
 * 1. Remove the port from ChainNode and include it in the URL.
 * 2. Add plenty of ChainNodes to allow for user switching.
 * 3. Add network column to Chains (so that we can share e.g. edgeware-testnet and edgeware-local).
 * 4. Add chain column to OffchainThreads to restrict comment threads to networks.
 * 5. Add a selectedNode column to Users to track which network they're on.
 */

const newChainRecords = [{
  id: 'edgeware-local',
  network: 'edgeware',
  symbol: 'EDG',
  name: 'Edgeware Local',
  active: true,
}, {
  id: 'cosmos',
  network: 'cosmos',
  symbol: 'ATOM',
  name: 'Cosmos Hub',
  active: false,
}, {
  id: 'cosmos-local',
  network: 'cosmos',
  symbol: 'ATOM',
  name: 'Cosmos Local',
  active: false,
}];

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // clean up old chains
      await queryInterface.bulkDelete('Chains', { id: [ 'cosmos', 'maker', 'tezos', 'polkadot', 'ethereum', ] },
                                      { transaction: t });
      // convert old 'edgeware' to new 'edgeware-testnet'
      await queryInterface.bulkUpdate('Chains', { id: 'edgeware-testnet', name: 'Edgeware Testnet' }, { id: 'edgeware' },
                                      { transaction: t });

      // update other columns to support node selection
      await Promise.all([
        queryInterface.removeColumn('ChainNodes', 'port', { transaction: t }),
        queryInterface.addColumn('Chains', 'network', {
          type: DataTypes.STRING,
          defaultValue: 'edgeware', // set default value to populate preexisting models' fields
          allowNull: false,
        }, { transaction: t }),
        queryInterface.addColumn('OffchainThreads', 'chain', {
          type: DataTypes.STRING,
          defaultValue: 'edgeware-testnet', // set default value to populate preexisting models' fields
          references: { model: 'Chains', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        }, { transaction: t }),
        queryInterface.addColumn('Users', 'selected_node_id', {
          type: DataTypes.INTEGER,
          references: { model: 'ChainNodes', key: 'id' },
          constraints: false,
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        }, { transaction: t }),
      ]);

      // add new chains (except for edgeware-testnet)
      await queryInterface.bulkInsert('Chains', newChainRecords, { transaction: t });

      // update nodes
      await queryInterface.bulkDelete('ChainNodes', { }, { transaction: t });

      await queryInterface.bulkInsert('ChainNodes', [
        { chain: 'edgeware-local', url: 'localhost:9944', },
        //{ chain: 'edgeware-testnet', url: 'testnode.edgewa.re', },
      ], { transaction: t });
    });
  },
  down: (queryInterface, DataTypes) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // remove chainNodes - leave empty afterwards (they were unused before, and there's no way to recover them)
      await queryInterface.bulkDelete('ChainNodes', { }, { transaction: t });
      await queryInterface.addColumn('ChainNodes', 'port', {
        type: DataTypes.INTEGER,
        defaultValue: 9944,
        allowNull: false,
      }, { transaction: t }),

      // remove new chains
      await queryInterface.bulkDelete('Chains', { id: newChainRecords.map(r => r.id) }, { transaction: t });

      // convert 'edgeware' back to 'edgeware-testnet'
      await queryInterface.bulkUpdate('Chains', { id: 'edgeware', name: 'Edgeware' }, { id: 'edgeware-testnet' },
                                      { transaction: t });

      await Promise.all([
        queryInterface.removeColumn('Chains', 'network', { transaction: t }),
        queryInterface.removeColumn('OffchainThreads', 'chain', { transaction: t }),
        queryInterface.removeColumn('Users', 'selected_node_id', { transaction: t }),
      ]);
    });
  }
}
