'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      // Adding new column "created_by" to "Threads" table
      await queryInterface.addColumn(
        'Threads',
        'created_by',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction: t }
      );

      // Making "address_id" nullable in "Threads"
      await queryInterface.changeColumn(
        'Threads',
        'address_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        { transaction: t }
      );

      // Dropping old foreign key constraint and Adding new one with "ON UPDATE CASCADE ON DELETE SET NULL"
      await queryInterface.sequelize.query(
        `ALTER TABLE "Threads" DROP CONSTRAINT "OffchainThreads_author_id_fkey"`,
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "Threads" ADD CONSTRAINT "OffchainThreads_author_id_fkey" FOREIGN KEY ("address_id") REFERENCES "Addresses"(id) ON UPDATE CASCADE ON DELETE SET NULL`,
        { transaction: t }
      );

      await queryInterface.addColumn(
        'Comments',
        'created_by',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction: t }
      );

      // Making "address_id" nullable in "Threads"
      await queryInterface.changeColumn(
        'Comments',
        'address_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        { transaction: t }
      );

      // Dropping old foreign key constraint and Adding new one with "ON UPDATE CASCADE ON DELETE SET NULL"
      await queryInterface.sequelize.query(
        `ALTER TABLE "Comments" DROP CONSTRAINT "Comments_address_id_fkey"`,
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "Comments" DROP CONSTRAINT "Comments_chain_fkey"`,
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "Comments" ADD CONSTRAINT "Comments_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "Addresses"(id) ON UPDATE CASCADE ON DELETE SET NULL`,
        { transaction: t }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      // Reverting to old foreign key constraint
      await queryInterface.sequelize.query(
        `ALTER TABLE "Threads" DROP CONSTRAINT "OffchainThreads_author_id_fkey"`,
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "Threads" ADD CONSTRAINT "OffchainThreads_author_id_fkey" FOREIGN KEY ("address_id") REFERENCES "Addresses"(id)`,
        { transaction: t }
      );

      // Reverting "address_id" to not nullable
      await queryInterface.changeColumn(
        'Threads',
        'address_id',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        { transaction: t }
      );

      // Removing "created_by" column from "Threads"
      await queryInterface.removeColumn('Threads', 'created_by', {
        transaction: t,
      });

      await queryInterface.sequelize.query(
        `ALTER TABLE "Comments" DROP CONSTRAINT "Comments_address_id_fkey"`,
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "Comments" ADD CONSTRAINT "Comments_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "Addresses"(id)`,
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "Comments" ADD CONSTRAINT "Comments_chain_fkey" FOREIGN KEY ("chain") REFERENCES "Chains"(id)`,
        { transaction: t }
      );

      await queryInterface.changeColumn(
        'Comments',
        'address_id',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        { transaction: t }
      );

      // Removing "created_by" column from "Threads"
      await queryInterface.removeColumn('Comments', 'created_by', {
        transaction: t,
      });
    });
  },
};
