'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
      UPDATE "Communities" SET network = 'csdk-beta' where id = 'csdk-beta';
      UPDATE "Communities" SET network = 'csdk-v1' where id = 'csdk-v1';
      UPDATE "Communities" SET network = 'csdk' where id = 'csdk';
      UPDATE "Communities" SET network = 'csdk-beta-ci' where id = 'csdk-beta-ci';
      UPDATE "Communities" SET network = 'evmos-dev' where id = 'evmos-dev';
      UPDATE "Communities" SET network = 'evmos-dev-ci' where id = 'evmos-dev-ci';
      `,
        { raw: true, transaction },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
      UPDATE "Communities" SET network = 'cosmos' where id = 'csdk-beta';
      UPDATE "Communities" SET network = 'cosmos' where id = 'csdk-v1';
      UPDATE "Communities" SET network = 'cosmos' where id = 'csdk';
      UPDATE "Communities" SET network = 'cosmos' where id = 'csdk-beta-ci';
      UPDATE "Communities" SET network = 'cosmos' where id = 'evmos-dev';
      UPDATE "Communities" SET network = 'cosmos' where id = 'evmos-dev-ci';
      `,
        { raw: true, transaction },
      );
    });
  },
};
