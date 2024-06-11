'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "ChainNodes" ADD cosmos_chain_id VARCHAR(255) NULL;
        ALTER TABLE "ChainNodes" ADD CONSTRAINT "Chain_nodes_unique_cosmos_chain_id" UNIQUE (cosmos_chain_id);
        ALTER TABLE "ChainNodes" ADD CONSTRAINT "Cosmos_chain_id_alphanumeric_lowercase" CHECK (cosmos_chain_id ~ '[a-z0-9]+');
        
        UPDATE "ChainNodes" SET cosmos_chain_id = 'agoric' WHERE name = 'Agoric';
        UPDATE "ChainNodes" SET cosmos_chain_id = 'acrechain' WHERE name = 'arable-protocol';
        UPDATE "ChainNodes" SET cosmos_chain_id = 'archway' WHERE name = 'Archway';
        UPDATE "ChainNodes" SET cosmos_chain_id = 'bitsong' WHERE name = 'Bitsong';
        UPDATE "ChainNodes" SET cosmos_chain_id = 'chain4energy' WHERE name = 'C4E';
        UPDATE "ChainNodes" SET cosmos_chain_id = 'carbon' WHERE name = 'Carbon Network';
        UPDATE "ChainNodes" SET cosmos_chain_id = 'cerberus' WHERE name = 'Cerberus';
        UPDATE "ChainNodes" SET cosmos_chain_id = 'cheqd' WHERE name = 'Cheqd';
        UPDATE "ChainNodes" SET cosmos_chain_id = 'chihuahua' WHERE name = 'Chihuahua';
        UPDATE "ChainNodes" SET cosmos_chain_id = 'composable' WHERE name = 'Composable Finance';

        UPDATE "ChainNodes" SET cosmos_chain_id = 'csdkv1' WHERE name = 'cosmos sdk devnet';
        UPDATE "ChainNodes" SET cosmos_chain_id = 'csdkbeta' WHERE name = 'cosmos sdk v0.45.0';
        UPDATE "ChainNodes" SET cosmos_chain_id = 'csdkv1ci' WHERE name = 'cosmos sdk v0.45.0 CI';
        UPDATE "ChainNodes" SET cosmos_chain_id = 'csdkbetaci' WHERE name = 'cosmos sdk v0.46.11';
        UPDATE "ChainNodes" SET cosmos_chain_id = 'crescent' WHERE name = 'Crescent Network';
        UPDATE "ChainNodes" SET cosmos_chain_id = 'evmos' WHERE name = 'Evmos';
        UPDATE "ChainNodes" SET cosmos_chain_id = 'evmosdevci' WHERE name = 'evmos dev ci';
        UPDATE "ChainNodes" SET cosmos_chain_id = 'evmosdev' WHERE name = 'evmos sandbox';
        UPDATE "ChainNodes" SET cosmos_chain_id = 'gravitybridge' WHERE name = 'Gravity Chain';
        UPDATE "ChainNodes" SET cosmos_chain_id = 'haqq' WHERE name = 'Haqq Network';

        UPDATE "ChainNodes" SET cosmos_chain_id = 'injective' WHERE name = 'Injective (Mainnet)';
        UPDATE "ChainNodes" SET cosmos_chain_id = 'jackal' WHERE name = 'Jackal Protocol';
        UPDATE "ChainNodes" SET cosmos_chain_id = 'juno' WHERE name = 'Juno';
        UPDATE "ChainNodes" SET cosmos_chain_id = 'kava' WHERE name = 'Kava';
        UPDATE "ChainNodes" SET cosmos_chain_id = 'kichain' WHERE name = 'KiChain';
        UPDATE "ChainNodes" SET cosmos_chain_id = 'kyve' WHERE name = 'KYVE Network';
        UPDATE "ChainNodes" SET cosmos_chain_id = 'odin' WHERE name = 'ODIN Protocol';
        UPDATE "ChainNodes" SET cosmos_chain_id = 'oraichain' WHERE name = 'Oraichain';
        UPDATE "ChainNodes" SET cosmos_chain_id = 'osmosis' WHERE name = 'Osmosis';
        UPDATE "ChainNodes" SET cosmos_chain_id = 'panacea' WHERE name = 'Panacea';

        UPDATE "ChainNodes" SET cosmos_chain_id = 'persistence' WHERE name = 'Persistence';
        UPDATE "ChainNodes" SET cosmos_chain_id = 'planq' WHERE name = 'Planq';
        UPDATE "ChainNodes" SET cosmos_chain_id = 'quasar' WHERE name = 'Quasar Finance';
        UPDATE "ChainNodes" SET cosmos_chain_id = 'quicksilver' WHERE name = 'Quicksilver Protocol';
        UPDATE "ChainNodes" SET cosmos_chain_id = 'qwoyn' WHERE name = 'Qwoyn Network';
        UPDATE "ChainNodes" SET cosmos_chain_id = 'regen' WHERE name = 'Regen Network';
        UPDATE "ChainNodes" SET cosmos_chain_id = 'secretnetwork' WHERE name = 'Secret Network';
        UPDATE "ChainNodes" SET cosmos_chain_id = 'sei' WHERE name = 'sei';
        UPDATE "ChainNodes" SET cosmos_chain_id = 'sentinel' WHERE name = 'Sentinel';
        UPDATE "ChainNodes" SET cosmos_chain_id = 'shentu' WHERE name = 'Shentu Chain';

        UPDATE "ChainNodes" SET cosmos_chain_id = 'sifchain' WHERE name = 'Sifchain';
        UPDATE "ChainNodes" SET cosmos_chain_id = 'sommelier' WHERE name = 'Stafihub';
        UPDATE "ChainNodes" SET cosmos_chain_id = 'stargaze' WHERE name = 'Stargaze';
        UPDATE "ChainNodes" SET cosmos_chain_id = 'terpnetwork' WHERE name = 'Terp Network ';
        UPDATE "ChainNodes" SET cosmos_chain_id = 'terra' WHERE name = 'Terra Classic ';
        UPDATE "ChainNodes" SET cosmos_chain_id = 'umee' WHERE name = 'Umee';
        UPDATE "ChainNodes" SET cosmos_chain_id = 'vidulum' WHERE name = 'Vidulum (Mainnet)';
        `,
        { raw: true, transaction: t }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "ChainNodes"
        DROP COLUMN cosmos_chain_id;
      `,
        { raw: true, transaction: t }
      );
    });
  },
};
