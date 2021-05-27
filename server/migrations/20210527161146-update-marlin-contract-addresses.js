'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // change marlin's address from MPond to GovAlpha
    await queryInterface.sequelize.query(
      "UPDATE \"ChainNodes\" SET address='0x777992c2E4EDF704e49680468a9299C6679e37F6' WHERE chain='marlin';"
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      "UPDATE \"ChainNodes\" SET address='0xfda6d91cbc6f6f69c15bbd85fed4e3b84f6bccd4' WHERE chain='marlin';"
    );
  }
};
