'use strict';

const molochDAOs = [
  {
    id: 'moloch',
    name: 'Moloch',
    description: 'MolochDAO',
    symbol: 'Moloch',
    network: 'moloch',
    icon_url: '/static/img/protocols/molochdao.png',
    active: true,
    type: 'dao',
  },
  {
    id: 'metacartel',
    name: 'Metacartel',
    description: 'Metacartel',
    symbol: 'Metacartel',
    network: 'metacartel',
    icon_url: '/static/img/protocols/metacartel.png',
    active: true,
    type: 'dao',
  },
];

const molochDAOAddresses = [
  {
    chain: 'moloch',
    url: 'wss://mainnet.infura.io/ws',
    address: '0x1fd169a4f5c59acf79d0fd5d91d1201ef1bce9f1',
  },
  {
    chain: 'metacartel',
    url: 'wss://mainnet.infura.io/ws',
    address: '0x0372f3696fa7dc99801f435fd6737e57818239f2',
  },
];

const metacartelDAOAddress = [];

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn('Chains', 'type', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'chain',
      });
      await queryInterface.addColumn('ChainNodes', 'address', {
        type: Sequelize.STRING,
        allowNull: true,
      });

      await queryInterface.bulkInsert('Chains', molochDAOs, { transaction: t });
      await queryInterface.bulkInsert('ChainNodes', molochDAOAddresses, {
        transaction: t,
      });
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('Chains', 'type');
      await queryInterface.removeColumn('ChainNodes', 'address');

      await queryInterface.bulkDelete(
        'Chains',
        { id: molochDAOs.map((r) => r.id) },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'ChainNodes',
        { id: molochDAOAddresses.map((r) => r.id) },
        { transaction: t }
      );
    });
  },
};
