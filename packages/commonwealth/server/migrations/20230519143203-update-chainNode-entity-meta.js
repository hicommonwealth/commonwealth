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

      await queryInterface.removeConstraint(
        'ChainEntityMeta',
        'ChainEntityMeta_chain_fkey',
        { transaction: t }
      );

      await queryInterface.sequelize.query(
        `
            CREATE TABLE "EventOrigins" as (SELECT C.id, CN.name, C2.address
                                            FROM "ChainNodes" CN
                                                     JOIN "Chains" C on CN.id = C.chain_node_id
                                                     LEFT JOIN "CommunityContracts" CC on C.id = CC.chain_id
                                                     LEFT JOIN "Contracts" C2 on CC.contract_id = C2.id);
        `,
        { transaction: t }
      );

      await queryInterface.addColumn(
        'ChainEntityMeta',
        'contract_address',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction: t }
      );

      // update entities with the ChainNode.name and CommunityContract.address
      await queryInterface.sequelize.query(
        `
            UPDATE "ChainEntityMeta" CE
            SET chain            = (SELECT name FROM "EventOrigins" WHERE id = CE.chain),
                contract_address = (SELECT address FROM "EventOrigins" WHERE id = CE.chain);
        `,
        { transaction: t }
      );

      await queryInterface.renameColumn(
        'ChainEntityMeta',
        'chain',
        'chain_name',
        {
          transaction: t,
        }
      );

      await queryInterface.addIndex(
        'ChainEntityMeta',
        ['chain_name', 'contract_address'],
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

      await queryInterface.renameColumn(
        'ChainEntityMeta',
        'chain_name',
        'chain',
        {
          transaction: t,
        }
      );

      await queryInterface.sequelize.query(
        `
            UPDATE "ChainEntityMeta" CE
            SET chain = (SELECT id FROM "EventOrigins" WHERE name = CE.chain AND address = CE.contract_address);
        `,
        { transaction: t }
      );

      await queryInterface.removeColumn('ChainEntityMeta', 'contract_address', {
        transaction: t,
      });

      await queryInterface.addConstraint('ChainEntityMeta', {
        fields: ['chain'],
        type: 'foreign key',
        name: 'ChainEntityMeta_chain_fkey',
        references: {
          table: 'Chains',
          field: 'id',
        },
        transaction: t,
      });
    });
  },
};
