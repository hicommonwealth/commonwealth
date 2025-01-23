'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        CREATE EXTENSION IF NOT EXISTS pgcrypto;  
      `,
        { transaction },
      );

      await queryInterface.addColumn(
        'Webhooks',
        'signing_key',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        UPDATE "Webhooks" SET signing_key = encode(gen_random_bytes(32), 'hex')`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Webhooks"
        ALTER COLUMN signing_key SET NOT NULL;
    `,
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Webhooks', 'signing_key');
  },
};
