'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `
        CREATE OR REPLACE FUNCTION notify_insert_outbox_function()
        RETURNS TRIGGER AS $$
        BEGIN
          IF NEW.relayed = false THEN
            PERFORM pg_notify('outbox_channel', NEW.event_id::TEXT);
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `,
    );
  },

  async down(queryInterface, Sequelize) {
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
    );
  },
};
