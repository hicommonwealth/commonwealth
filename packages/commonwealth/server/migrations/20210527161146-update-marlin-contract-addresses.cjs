'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // change marlin's address from MPond to GovAlpha
    await queryInterface.sequelize.query(
      "UPDATE \"ChainNodes\" SET address='0x777992c2E4EDF704e49680468a9299C6679e37F6' WHERE chain='marlin';"
    );
    // fix Marlin's URL
    await queryInterface.sequelize.query(
      "UPDATE \"ChainNodes\" SET url='wss://mainnet.infura.io/ws' WHERE chain='marlin';"
    );
    await queryInterface.sequelize.query(
      "UPDATE \"ChainNodes\" SET url='wss://ropsten.infura.io/ws' WHERE chain='marlin-testnet';"
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      "UPDATE \"ChainNodes\" SET address='0xfda6d91cbc6f6f69c15bbd85fed4e3b84f6bccd4' WHERE chain='marlin';"
    );
    await queryInterface.sequelize.query(
      "UPDATE \"ChainNodes\" SET url='wss://mainnet.infura.io/ws/v3/90de850aff68424ab8e7321017406586' WHERE chain='marlin';"
    );
    await queryInterface.sequelize.query(
      "UPDATE \"ChainNodes\" SET url='wss://ropsten.infura.io/ws/v3/90de850aff68424ab8e7321017406586' WHERE chain='marlin-testnet';"
    );
  },
};
