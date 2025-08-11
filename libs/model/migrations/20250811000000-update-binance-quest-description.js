'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        UPDATE "Quests" 
        SET "description" = 'This is a bonus powered by Binance for initial sign up with Binance wallet. 

IMPORTANT: Sign up MUST BE DONE VIA THE BINANCE WALLET APP.

Steps to complete:
1. Open Binance Wallet app
2. Create your account or sign in
3. Connect your wallet to Common
4. Complete the signup process

Visit Binance to explore more onchain: https://www.binance.com/en/web3'
        WHERE id = -4;
        `,
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        UPDATE "Quests" 
        SET "description" = 'This is a bonus powered by Binance for initial sign up with Binance wallet. Visit Binance to explore more onchain: https://www.binance.com/en/web3'
        WHERE id = -4;
        `,
        { transaction },
      );
    });
  },
};