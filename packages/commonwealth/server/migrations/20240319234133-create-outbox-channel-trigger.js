'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        CREATE OR REPLACE FUNCTION notify_insert_outbox_function()
        RETURNS TRIGGER AS $$
        BEGIN
          IF NEW.relayed = false THEN
            PERFORM pg_notify('outbox_channel', NEW.event_name);
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        CREATE TRIGGER outbox_insert_trigger
        AFTER INSERT ON "Outbox"
        FOR EACH ROW
        EXECUTE FUNCTION notify_insert_outbox_function();
      `,
        { transaction },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        DROP TRIGGER IF EXISTS outbox_insert_trigger ON "Outbox";
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        DROP FUNCTION IF EXISTS notify_insert_outbox_function();
      `,
        { transaction },
      );
    });
  },
};
