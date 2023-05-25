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
          WHEN url = 'wss://forno.celo.org/ws' THEN 'https://forno.celo.org'
          ELSE url
        END,
        private_url = CASE
          WHEN url = 'wss://eth-mainnet.alchemyapi.io/v2/BCNLWCaGqaXwCDHlZymPy3HpjXSxK7j_' THEN REPLACE(private_url, 'wss://', 'https://')
          ELSE private_url
        END
        WHERE url in ('wss://eth-mainnet.alchemyapi.io/v2/BCNLWCaGqaXwCDHlZymPy3HpjXSxK7j_', 'wss://polygon-mumbai.g.alchemy.com/v2/HaGTCcKYKQyX68DYEa9_6F5E7ASxhoAS', 'wss://misty-rough-haze.fantom.quiknode.pro/cf2cf5b4d7fbf487e2ea8affcbd876219fe6576e/', 'wss://forno.celo.org/ws')
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
        WHEN url = 'https://forno.celo.org/ws' THEN 'wss://forno.celo.org/ws'
        ELSE url
      END,
      private_url = CASE
        WHEN url = 'https://eth-mainnet.alchemyapi.io/v2/BCNLWCaGqaXwCDHlZymPy3HpjXSxK7j_' THEN REPLACE(private_url,  'https://', 'wss://')
        ELSE private_url
      END
      WHERE url in ('https://eth-mainnet.alchemyapi.io/v2/BCNLWCaGqaXwCDHlZymPy3HpjXSxK7j_', 'https://polygon-mumbai.g.alchemy.com/v2/HaGTCcKYKQyX68DYEa9_6F5E7ASxhoAS', 'https://misty-rough-haze.fantom.quiknode.pro/cf2cf5b4d7fbf487e2ea8affcbd876219fe6576e/', 'https://forno.celo.org')
  `);
  },
};
