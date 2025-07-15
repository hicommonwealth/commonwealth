'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        update "ChainNodes" set url = 'https://odin-rpc.lavenderfive.com/' where url = 'http://34.79.179.216:26657';
        update "ChainNodes" set url = 'https://rpc-regen.ecostake.com' where url = 'http://public-rpc.regen.vitwit.com:26657/';
        `,
        { raw: true, transaction: t }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        update "ChainNodes" set url = 'http://34.79.179.216:26657' where url = 'https://odin-rpc.lavenderfive.com/';
        update "ChainNodes" set url = 'http://public-rpc.regen.vitwit.com:26657/' where url = 'https://rpc-regen.ecostake.com';
        `,
        { raw: true, transaction: t }
      );
    });
  },
};
