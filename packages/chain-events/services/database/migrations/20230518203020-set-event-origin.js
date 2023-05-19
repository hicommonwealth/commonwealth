'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      const CW_DB_URL =
        process.env.CW_DB_URL ||
        'postgresql://commonwealth:edgeware@localhost/commonwealth';

      // fetch ChainNode.name and CommunityContract.address from Commonwealth db
      await queryInterface.sequelize.query(
        `
        CREATE TABLE "EventOrigins" as (
          SELECT *
          FROM dblink(${CW_DB_URL}, '
            SELECT C.id, CN.name, C2.address
            FROM "ChainNodes" CN
               JOIN "Chains" C on CN.id = C.chain_node_id
               LEFT JOIN "CommunityContracts" CC on C.id = CC.chain_id
               LEFT JOIN "Contracts" C2 on CC.contract_id = C2.id
          ') as "cw_data"(id VARCHAR(255), name VARCHAR(255), address VARCHAR(255))
        );
      `,
        { transaction: t }
      );

      // TODO: verify that migration fails if the above dblink query fails

      await queryInterface.addColumn(
        'ChainEvents',
        'contract_address',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction: t }
      );

      await queryInterface.addColumn(
        'ChainEntities',
        'contract_address',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction: t }
      );

      // update events with the ChainNode.name and CommunityContract.address
      await queryInterface.sequelize.query(
        `
        UPDATE "ChainEvents" CE
        SET chain = (SELECT name FROM "EventOrigins" WHERE id = CE.chain),
            contract_address = (SELECT address FROM "EventOrigins" WHERE id = CE.chain);
      `,
        { transaction: t }
      );

      // remove the old ChainEntity unique constraint
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "ChainEntities"
        DROP CONSTRAINT "ChainEntities_chain_type_type_id_uk";
      `,
        { transaction: t }
      );

      // update entities with the ChainNode.name and CommunityContract.address
      await queryInterface.sequelize.query(
        `
        UPDATE "ChainEntities" CE
        SET chain = (SELECT name FROM "EventOrigins" WHERE id = CE.chain),
            contract_address = (SELECT address FROM "EventOrigins" WHERE id = CE.chain);
      `,
        { transaction: t }
      );

      // add new unique constraint
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "ChainEntities"
          ADD CONSTRAINT "ChainEntities_chain_type_type_id_contract_address_uk"
            UNIQUE (chain, type, type_id, contract_address);
      `,
        { transaction: t }
      );

      // TODO: drop EventOrigins table in follow up PR/migration so we can revert easily
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      // remove the new ChainEntity unique constraint
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "ChainEntities"
        DROP CONSTRAINT "ChainEntities_chain_type_type_id_contract_address_uk";
      `,
        { transaction: t }
      );

      await queryInterface.sequelize.query(
        `
        UPDATE "ChainEntities" CE
        SET chain = (SELECT id FROM "EventOrigins" WHERE name = CE.chain AND address = CE.contract_address);
      `,
        { transaction: t }
      );

      // re-add the old ChainEntity unique constraint
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "ChainEntities"
        ADD CONSTRAINT "ChainEntities_chain_type_type_id_uk"
          UNIQUE (chain, type, type_id);
      `,
        { transaction: t }
      );

      await queryInterface.sequelize.query(
        `
        UPDATE "ChainEvents" CE
        SET chain = (SELECT id FROM "EventOrigins" WHERE name = CE.chain AND address = CE.contract_address);
      `,
        { transaction: t }
      );

      await queryInterface.removeColumn('ChainEntities', 'contract_address', {
        transaction: t,
      });
      await queryInterface.removeColumn('ChainEvents', 'contract_address', {
        transaction: t,
      });

      // drop the EventOrigins table
      await queryInterface.dropTable('EventOrigins', { transaction: t });
    });
  },
};
