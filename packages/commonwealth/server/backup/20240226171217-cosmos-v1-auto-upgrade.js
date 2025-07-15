'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "ChainNodes" ADD COLUMN IF NOT EXISTS "cosmos_gov_version" VARCHAR(64) NULL;

        UPDATE "ChainNodes" SET "cosmos_gov_version" = 'v1' 
        WHERE cosmos_chain_id IN (
          'kyve',
          'csdkv1',
          'csdkv1ci',
          'quicksilver',
          'juno',
          'regen',
          'umee',
          'chihuahua',
          'qwoyn'
        );
        `,
        { raw: true, transaction: t },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
          ALTER TABLE "ChainNodes" DROP COLUMN "cosmos_gov_version";
        `,
        { raw: true, transaction: t },
      );
    });
  },
};
