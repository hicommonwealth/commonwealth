'use strict';

const Hash = require('object-hash');

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
      for (const { event_data, id } of events[0]) {
        if (!(i % 500)) {
          console.log(`Updated ${i} events of ${events[0].length}...`);
        }
        i++;
        const hash = Hash(event_data);
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
