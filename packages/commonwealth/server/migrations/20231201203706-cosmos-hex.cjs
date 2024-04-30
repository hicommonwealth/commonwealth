'use strict';

module.exports = {
  up: async (queryInterface) => {
    const { toHex, fromBech32 } = await import('@cosmjs/encoding');
    const getHex = (address) => {
      const encodedData = fromBech32(address).data;
      return toHex(encodedData);
    };

    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Addresses" ADD COLUMN IF NOT EXISTS "hex" VARCHAR(64) NULL;
        `,
        { raw: true },
      );

      // get all cosmos addresses and assign a hex string
      const [addresses] = await queryInterface.sequelize.query(
        `
        SELECT id, address
        FROM "Addresses"
        WHERE "wallet_id" IN ('keplr', 'leap', 'cosm-metamask', 'terrastation', 'keplr-ethereum');     
          `,
        { transaction: t },
      );

      const ids = [];
      const hexs = [];
      for (const { id, address } of addresses) {
        try {
          hexs.push(`'${getHex(address)}'`);
          ids.push(id);
        } catch (e) {
          // do nothing.
        }
      }

      if (hexs.length > 0) {
        try {
          // bulk update addresses with hex:
          await queryInterface.sequelize.query(
            `update "Addresses" 
             set hex = data_table.hex 
             from 
               (select unnest(ARRAY[${ids.join(
                 ',',
               )}]) as id, unnest(ARRAY[${hexs.join(',')}]) as hex) 
                as data_table
             where "Addresses".id = data_table.id;`,
          );
        } catch (e) {
          console.log('bulkInsert Addresses failed:', e, e.errors);
          throw e;
        }
      }

      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Addresses"
          ADD CONSTRAINT cosmos_requires_hex
          CHECK ((wallet_id NOT IN ('keplr', 'leap', 'cosm-metamask', 'terrastation', 'keplr-ethereum')) OR (wallet_id IN ('keplr', 'leap', 'cosm-metamask', 'terrastation', 'keplr-ethereum') AND hex IS NOT NULL)) NOT VALID;
        `,
        { raw: true, transaction: t },
      );
    });
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
          ALTER TABLE "Addresses"
          DROP CONSTRAINT IF EXISTS "cosmos_requires_hex",
          DROP COLUMN "hex";
        `,
        { raw: true, transaction: t },
      );
    });
  },
};
