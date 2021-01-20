
const SequelizeLib = require('sequelize');
const Op = SequelizeLib.Op;

const SubstrateEventKinds = {
  Offence: 'offences-offence'
};

module.exports = {
  up: (queryInterface, Sequelize) => {
    // add chain_event and chain_event_type tables
    return queryInterface.sequelize.transaction(async (t) => {
      const buildObject = (event_name, chain) => ({
        id: `${chain}-${event_name}`,
        chain,
        event_name,
      });

      const kusamaObjs = Object.values(SubstrateEventKinds).map((s) => buildObject(s, 'kusama'));
      const edgewareObjs = Object.values(SubstrateEventKinds).map((s) => buildObject(s, 'edgeware'));
      const objs = kusamaObjs.concat(edgewareObjs);

      return queryInterface.bulkInsert(
        'ChainEventTypes',
        [
          ...objs,
        ],
        { transaction: t }
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete('ChainEventTypes', {
        event_name: SubstrateEventKinds.Offence,
      }, { transaction: t });
    });
  }
};
