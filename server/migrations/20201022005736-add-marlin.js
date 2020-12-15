'use strict';
import { MarlinTypes } from '@commonwealth/chain-events';

const SequelizeLib = require('sequelize');
const Op = SequelizeLib.Op;

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert('Chains', [{
        id: 'marlin',
        symbol: 'LIN',
        name: 'Marlin',
        icon_url: '/static/img/protocols/lin.png',
        type: 'dao',
        network: 'marlin',
        active: true,
      }], { transaction: t });

      await queryInterface.bulkInsert('ChainNodes', [{
        chain: 'marlin',
        url: 'wss://ropsten.infura.io/ws',
        address: '0xEa2923b099b4B588FdFAD47201d747e3b9599A5f', // POND Contract Address
      }], { transaction: t });

      const buildObject = (event_name, chain) => ({
        id: `${chain}-${event_name}`,
        chain,
        event_name,
      });
      const marlinObjs = Object.values(MarlinTypes.EventKinds).map((s) => buildObject(s, 'marlin'));

      // TODO: somehow switch this on for testing purposes?
      return queryInterface.bulkInsert(
        'ChainEventTypes',
        [
          ...marlinObjs,
        ],
        { transaction: t }
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete('OffchainReactions', { chain: 'marlin' }, { transaction: t });
      await queryInterface.bulkDelete('OffchainComments', { chain: 'marlin' }, { transaction: t });
      await queryInterface.bulkDelete('OffchainThreads', { chain: 'marlin' }, { transaction: t });
      await queryInterface.bulkDelete('Addresses', { chain: 'marlin' }, { transaction: t });
      await queryInterface.bulkDelete('ChainEventTypes', { chain: 'marlin' }, { transaction: t });
      await queryInterface.bulkDelete('ChainNodes', { chain: 'marlin' }, { transaction: t });
      await queryInterface.bulkDelete('Chains', { id: ['marlin'] }, { transaction: t });
    });
  }
};
