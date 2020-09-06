const SequelizeLib = require('sequelize');
const Op = SequelizeLib.Op;

const EventsToAdd = ['some-offline', 'heartbeat-received'];
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      const buildObject = (event_name, chain) => ({
        id: `${chain}-${event_name}`,
        chain,
        event_name
      });
      const kusamaObjs = EventsToAdd.map((s) => buildObject(s, 'kusama'));
      const edgewareObjs = EventsToAdd.map((s) => buildObject(s, 'edgeware'));
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
        '$or' : [{
          event_name: EventsToAdd[0]
        }, {
          event_name: EventsToAdd[1]
        }],
      }, { transaction: t });
    });
  }
};
