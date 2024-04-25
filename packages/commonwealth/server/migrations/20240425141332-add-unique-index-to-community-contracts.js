'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
 ALTER TABLE ONLY public."CommunityContracts"
 ADD CONSTRAINT "CommunityContracts_community_id_contract_id_key" UNIQUE(community_id, contract_id);
 
 ALTER TABLE ONLY public."CommunityContracts"
 DROP CONSTRAINT IF EXISTS "community_contracts_community_id";
         `,
        {
          transaction: t,
        },
      );
    });
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
 ALTER TABLE ONLY public."CommunityContracts"
 DROP CONSTRAINT IF EXISTS "CommunityContracts_community_id_contract_id_key";

 ALTER TABLE ONLY public."CommunityContracts"
 ADD CONSTRAINT "community_contracts_community_id" UNIQUE(community_id);
         `,
        {
          transaction: t,
        },
      );
    });
  },
};
