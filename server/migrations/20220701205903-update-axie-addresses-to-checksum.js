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
      console.log(JSON.stringify(addressesToDelete));
      for (const [idToDelete, idToUpdate] of Object.entries(addressesToDelete)) {
        await queryInterface.sequelize.query(
          `UPDATE "Collaborations" SET address_id=${idToUpdate} WHERE address_id=${idToDelete};`,
          { transaction }
        );
        await queryInterface.sequelize.query(
          `UPDATE "OffchainComments" SET address_id=${idToUpdate} WHERE address_id=${idToDelete};`,
          { transaction }
        );
        await queryInterface.sequelize.query(
          `UPDATE "OffchainThreads" SET address_id=${idToUpdate} WHERE address_id=${idToDelete};`,
          { transaction }
        );
        await queryInterface.sequelize.query(
          `UPDATE "OffchainReactions" SET address_id=${idToUpdate} WHERE address_id=${idToDelete};`,
          { transaction }
        );
        await queryInterface.sequelize.query(
          `DELETE FROM "OffchainProfiles" WHERE address_id=${idToDelete};`,
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
