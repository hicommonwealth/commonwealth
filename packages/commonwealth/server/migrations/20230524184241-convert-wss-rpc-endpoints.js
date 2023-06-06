'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      UPDATE "ChainNodes"
      SET 
        url = CASE
          WHEN url = 'wss://eth-mainnet.alchemyapi.io/v2/BCNLWCaGqaXwCDHlZymPy3HpjXSxK7j_' THEN REPLACE(url, 'wss://', 'https://')
          WHEN url = 'wss://polygon-mumbai.g.alchemy.com/v2/HaGTCcKYKQyX68DYEa9_6F5E7ASxhoAS' THEN REPLACE(url, 'wss://', 'https://')
          WHEN url = 'wss://misty-rough-haze.fantom.quiknode.pro/cf2cf5b4d7fbf487e2ea8affcbd876219fe6576e/' THEN REPLACE(url, 'wss://', 'https://')
          WHEN url = 'wss://eth-goerli.g.alchemy.com/v2/j4q_OFABLwfgV8b8Hel7JKLXH1y3G4_y' THEN REPLACE(url, 'wss://', 'https://')
          WHEN url = 'wss://holy-spring-wave.bsc.quiknode.pro/a6955f0547ae82229a6379ca6f16fd672cb997eb/' THEN REPLACE(url, 'wss://', 'https://')
          WHEN url = 'wss://arb-mainnet.g.alchemy.com/v2/wJE2b7MRNJgk7S8dfgb_1xZNUDq7SF7G' THEN REPLACE(url, 'wss://', 'https://')
          WHEN url = 'wss://eth-ropsten.alchemyapi.io/v2/2xXT2xx5AvA3GFTev3j_nB9LzWdmxPk7' THEN REPLACE(url, 'wss://', 'https://')
          WHEN url = 'wss://forno.celo.org/ws' THEN 'https://forno.celo.org'
          WHEN url = 'wss://ws-fuse-mainnet.chainstacklabs.com/' THEN 'https://fuse-mainnet.chainstacklabs.com/'
          WHEN url = 'wss://ws.s0.t.hmny.io/' THEN 'https://api.s0.t.hmny.io/'
          WHEN url = 'wss://ws-matic-mainnet.chainstacklabs.com' THEN 'https://matic-mainnet.chainstacklabs.com'
          WHEN url = 'wss://rpc.xdaichain.com/wss' THEN 'https://rpc.xdaichain.com/'
          ELSE url
        END,
        private_url = CASE
          WHEN url = 'wss://eth-mainnet.alchemyapi.io/v2/BCNLWCaGqaXwCDHlZymPy3HpjXSxK7j_' THEN REPLACE(private_url, 'wss://', 'https://')
          ELSE private_url
        END
        WHERE balance_type = 'ethereum';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
    UPDATE "ChainNodes"
    SET 
      url = CASE
        WHEN url = 'https://eth-mainnet.alchemyapi.io/v2/BCNLWCaGqaXwCDHlZymPy3HpjXSxK7j_' THEN REPLACE(url,  'https://', 'wss://')
        WHEN url = 'https://polygon-mumbai.g.alchemy.com/v2/HaGTCcKYKQyX68DYEa9_6F5E7ASxhoAS' THEN REPLACE(url,  'https://', 'wss://')
        WHEN url = 'https://misty-rough-haze.fantom.quiknode.pro/cf2cf5b4d7fbf487e2ea8affcbd876219fe6576e/' THEN REPLACE(url,  'https://', 'wss://')
        WHEN url = 'https://eth-goerli.g.alchemy.com/v2/j4q_OFABLwfgV8b8Hel7JKLXH1y3G4_y' THEN REPLACE(url, 'https://', 'wss://')
        WHEN url = 'https://holy-spring-wave.bsc.quiknode.pro/a6955f0547ae82229a6379ca6f16fd672cb997eb/' THEN REPLACE(url, 'https://', 'wss://')
        WHEN url = 'https://arb-mainnet.g.alchemy.com/v2/wJE2b7MRNJgk7S8dfgb_1xZNUDq7SF7G' THEN REPLACE(url, 'https://', 'wss://')
        WHEN url = 'https://eth-ropsten.alchemyapi.io/v2/2xXT2xx5AvA3GFTev3j_nB9LzWdmxPk7' THEN REPLACE(url, 'https://', 'wss://')
        WHEN url = 'https://forno.celo.org/ws' THEN 'wss://forno.celo.org/ws'
        WHEN url = 'https://fuse-mainnet.chainstacklabs.com/' THEN 'wss://ws-fuse-mainnet.chainstacklabs.com/'
        WHEN url =  'https://api.s0.t.hmny.io/' THEN 'wss://ws.s0.t.hmny.io/'
        WHEN url = 'https://matic-mainnet.chainstacklabs.com' THEN 'wss://ws-matic-mainnet.chainstacklabs.com'
        WHEN url =  'https://rpc.xdaichain.com/' THEN 'wss://rpc.xdaichain.com/wss'
        ELSE url
      END,
      private_url = CASE
        WHEN url = 'https://eth-mainnet.alchemyapi.io/v2/BCNLWCaGqaXwCDHlZymPy3HpjXSxK7j_' THEN REPLACE(private_url,  'https://', 'wss://')
        ELSE private_url
      END
      WHERE balance_type = 'ethereum';
  `);
  },
};
