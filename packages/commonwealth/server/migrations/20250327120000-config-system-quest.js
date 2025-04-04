'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        -- configures system action meta to scope WalletLinked to metamask
        UPDATE "QuestActionMetas" 
        SET 
          "reward_amount" = 5,
          "creator_reward_weight" = 0,
          "content_id" = 'wallet:metamask'
        WHERE "id" = -2;

        -- TODO: configure other WalletLinked actions scoped to other wallets
        `,
        { transaction },
      );
    });
  },

  async down() {},
};
