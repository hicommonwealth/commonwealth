'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`UPDATE "Chains" SET "type"='token' WHERE "id"='fei'`, { transaction: t });
      await queryInterface.sequelize.query(`UPDATE "Chains" SET "type"='token' WHERE "id"='yearn'`, { transaction: t });
      await queryInterface.sequelize.query(`UPDATE "Chains" SET "type"='token' WHERE "id"='sushi'`, { transaction: t });
      await queryInterface.sequelize.query(`DELETE FROM "ChainNodes" WHERE "chain"='demo'`, { transaction: t });
      await queryInterface.sequelize.query(`DELETE FROM "Chains" WHERE "id"='demo'`, { transaction: t });
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`UPDATE "Chains" SET "type"='chain' WHERE "id"='fei'`, { transaction: t });
      await queryInterface.sequelize.query(`UPDATE "Chains" SET "type"='chain' WHERE "id"='yearn'`, { transaction: t });
      await queryInterface.sequelize.query(`UPDATE "Chains" SET "type"='chain' WHERE "id"='sushi'`, { transaction: t });
    });
  }
};
