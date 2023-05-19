'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      /*
       * Add a constraint which prevents ChainNode.name from being updated since the ChainEvents service
       * uses the ChainNode.name to determine where an event came from. If the name is updated then events
       * would be classified as coming from a different chain than previous events from the same chain.
       */
      await queryInterface.sequelize.query(
        `
        CREATE OR REPLACE FUNCTION prevent_cn_name_update() RETURNS TRIGGER AS $$
        BEGIN
            IF NEW.name <> OLD.name THEN
                RAISE EXCEPTION 'Update of ChainNode name is not allowed';
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `,
        { transaction: t }
      );

      await queryInterface.sequelize.query(
        `
        CREATE TRIGGER prevent_cn_name_update_trigger
          BEFORE UPDATE ON "ChainNodes"
          FOR EACH ROW
        EXECUTE FUNCTION prevent_cn_name_update();
      `,
        { transaction: t }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        DROP TRIGGER IF EXISTS prevent_cn_name_update_trigger ON "ChainNodes";
      `,
        { transaction: t }
      );

      await queryInterface.sequelize.query(
        `
        DROP FUNCTION IF EXISTS prevent_cn_name_update;
      `,
        { transaction: t }
      );
    });
  },
};
