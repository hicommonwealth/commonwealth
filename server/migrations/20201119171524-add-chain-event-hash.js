'use strict';

const Hash = require('../util/chainEventHash');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn('ChainEvents', 'hash', {
        type: Sequelize.STRING, allowNull: true,
      }, { transaction: t });

      // add hash to all events
      const events = await queryInterface.sequelize.query(
        'SELECT * FROM "ChainEvents" WHERE "chain_event_type_id" NOT LIKE \'%reward\' AND  "chain_event_type_id" NOT LIKE \'%bonded\' AND  "chain_event_type_id" NOT LIKE \'%slash\'',
        { transaction: t },
      );
      let i = 0;
      for (const { event_data, id, block_number } of events[0]) {
        if (!(i % 500)) {
          console.log(`Updated ${i} events of ${events[0].length}...`);
        }
        i++;
        const hash = Hash({ data: event_data, blockNumber: block_number });
        await queryInterface.bulkUpdate('ChainEvents', {
          id,
        }, {
          hash,
        }, {
          transaction: t,
        });
      }
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('ChainEvents', 'hash');
  }
};
