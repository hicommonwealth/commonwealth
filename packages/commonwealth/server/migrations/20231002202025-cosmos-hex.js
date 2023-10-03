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

      // then consolidate similar hexes into user_id with latest last_active
      const [hexes] = await queryInterface.sequelize.query(
        `
        SELECT hex, last_active
        FROM "Addresses"
        WHERE hex IS NOT NULL AND last_active IS NOT NULL
        GROUP BY hex, last_active;
        `,
        { transaction: t }
      );

      for (const hex of hexes) {
        const [address] = await queryInterface.sequelize.query(
          `
          SELECT id, user_id, profile_id
          FROM "Addresses"
          WHERE hex = '${hex.hex}'
          ORDER BY last_active DESC
          LIMIT 1;
          `,
          { transaction: t }
        );

        await queryInterface.sequelize.query(
          `
          UPDATE "Addresses"
          SET user_id = ${address[0].user_id}, profile_id = ${address[0].profile_id}
          WHERE hex = '${hex.hex}';
          `,
          { transaction: t }
        );
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `ALTER TABLE "Addresses" DROP COLUMN "hex";`,
        { raw: true, transaction: t }
      );
    });
  },
};
