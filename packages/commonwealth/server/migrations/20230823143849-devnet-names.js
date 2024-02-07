'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `
      UPDATE "Chains" SET name = 'CSDK v1 Sandbox' WHERE id = 'csdk';
      UPDATE "Chains" SET name = 'CSDK beta Sandbox' WHERE id = 'csdk-beta';
      `,
      { raw: true }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `
      UPDATE "Chains" SET name = 'Cosmos SDK CI - Gov v1beta1 v0.45.0' WHERE id = 'csdk';
      UPDATE "Chains" SET name = 'Cosmos SDK CI - Gov V1 v0.46.11' WHERE id = 'csdk-beta';
      `,
      { raw: true }
    );
  },
};
