'use strict';


const SubstrateEventKinds = {
  AllGood: 'all-good',
};

module.exports = {
  up: (queryInterface, DataTypes) => {
    // add chain_event and chain_event_type tables
    return queryInterface.sequelize.transaction(async (t) => {
      const buildObject = (event_name, chain) => ({
        id: `${chain}-${event_name}`,
        chain,
        event_name,
      });

      const edgewareObjs = Object.values(SubstrateEventKinds).map((s) => buildObject(s, 'edgeware'));
      return queryInterface.bulkInsert(
        'ChainEventTypes',
        [
          ...edgewareObjs
        ],
        { transaction: t }
      );
    });
  },
  down: (queryInterface, DataTypes) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete('ChainEventTypes', {
        event_name: SubstrateEventKinds.AllGood
      }, { transaction: t });
    });
  }
};
