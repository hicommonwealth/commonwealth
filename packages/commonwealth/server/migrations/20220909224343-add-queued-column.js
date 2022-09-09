'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Chains', 'queued', { type: Sequelize.BOOLEAN });
    await queryInterface.sequelize.query(`
      UPDATE "Chains"
      SET queued = true;
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE "Chains" ALTER COLUMN queued SET DEFAULT False;
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE "Chains" ALTER COLUMN queued SET NOT NULL;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Chains', 'queued');
  }
};
