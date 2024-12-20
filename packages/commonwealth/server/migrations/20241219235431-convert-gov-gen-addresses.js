'use strict';

const { bech32 } = require('bech32');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const addresses = await queryInterface.sequelize.query(
        `
          SELECT address, user_id
          FROM "Addresses"
          WHERE community_id = 'atomone' AND address LIKE 'govgen%';
      `,
        { type: Sequelize.QueryTypes.SELECT, transaction },
      );

      for (const address of addresses) {
        const { words } = bech32.decode(address.address);
        const encodedAddress = bech32.encode('atone', words);

        await queryInterface.sequelize.query(
          `
            UPDATE "Addresses"
            SET address = '${encodedAddress}'
            WHERE address = '${address.address}' AND community_id = 'atomone';
        `,
          { transaction },
        );
      }
    });
  },

  async down(queryInterface, Sequelize) {},
};
