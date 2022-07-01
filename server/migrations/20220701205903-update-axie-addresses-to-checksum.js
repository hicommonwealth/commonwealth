'use strict';
const { query } = require('@polkadot/api-derive/staking');
const {toChecksumAddress} = require('web3-utils');


module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      const addresses = await queryInterface.sequelize.query(
        `SELECT * FROM "Addresses" WHERE chain='axie-infinity';`,
        { transaction }
      );

      const addressesToUpdate = {};
      const addressesToDelete = {};
      for (const addressObj of addresses[0]) {
        const address = addressObj.address;
        const checksumAddress = toChecksumAddress(address);
        if (!addressesToUpdate[checksumAddress]) {
          addressesToUpdate[checksumAddress] = addressObj.id;
        } else {
          addressesToDelete[addressObj.id] = addressesToUpdate[checksumAddress];
        }
      }

      for (const [idToDelete, idToUpdate] of addressesToDelete) {
        await queryInterface.sequelize.query(
          `DELETE FROM "OffchainComments" WHERE address_id=${idToDelete};`,
          { transaction }
        );
        await queryInterface.sequelize.query(
          `DELETE FROM "OffchainThreads" WHERE address_id=${idToDelete};`,
          { transaction }
        );
        await queryInterface.sequelize.query(
          `DELETE FROM "OffchainReactions" WHERE address_id=${idToDelete};`,
          { transaction }
        );
        await queryInterface.sequelize.query(
          `DELETE FROM "Addresses" WHERE id=${idToDelete};`,
          { transaction }
        );
      }

      for (const [address, id] of Object.entries(addressesToUpdate)) {
        await queryInterface.sequelize.query(
          `UPDATE "Addresses" SET address='${address}' WHERE id=${id};`,
          { transaction }
        );
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
    * Nothing to be done :)
    */
  }
};
