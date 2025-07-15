'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      const preimageNotedEvents = await queryInterface.sequelize.query(
        'SELECT * FROM "ChainEvents" WHERE chain_event_type_id LIKE \'%preimage-noted\'',
        { transaction: t }
      );
      await Promise.all(
        preimageNotedEvents[0].map(({ id, event_data }) => {
          // truncate the args if necessary
          const newArgs = event_data.preimage.args.map((m) =>
            m.length > 64 ? `${m.slice(0, 63)}…` : m
          );
          return queryInterface.sequelize.query(
            `UPDATE "ChainEvents" SET "event_data" = jsonb_set("event_data"::jsonb, '{preimage,args}', '${JSON.stringify(
              newArgs
            )}') WHERE id = ${id}`,
            { transaction: t }
          );
        })
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return Promise.resolve();
  },
};
