'use strict';

const getHex = async (address) => {
  const { toHex, fromBech32 } = await import('@cosmjs/encoding');
  const encodedData = fromBech32(address).data;
  const addressHex = toHex(encodedData);
  return addressHex;
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Addresses" ADD COLUMN "hex" VARCHAR(64) NULL;
        `,
        { raw: true, transaction: t }
      );

      // get all cosmos addresses and assign a hex
      const [addresses] = await queryInterface.sequelize.query(
        `
          SELECT id, address
          FROM "Addresses"
          WHERE "wallet_id" = 'keplr';
          `,
        { transaction: t }
      );

      for (const address of addresses) {
        try {
          const hex = await getHex(address.address);

          //TODO: can we replicate the function in SQL?
          // get the migration declarative (instead of looping), down to 2 minutes in PROD
          // maybe batching

          await queryInterface.sequelize.query(
            `
            UPDATE "Addresses"
            SET hex = '${hex}'
            WHERE id = ${address.id};
            `,
            { transaction: t }
          );
        } catch (e) {
          console.log(
            `Error getting hex for ${address.address}. Not updating.`
          );
        }
      }
    });
    // time to complete: 13s
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
          ALTER TABLE "Addresses" DROP COLUMN "hex";
        `,
        { raw: true, transaction: t }
      );
    });
  },
};
