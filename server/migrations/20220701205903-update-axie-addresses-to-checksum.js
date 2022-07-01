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

      let count = 0;
      const updatedAddresses = addresses[0].map((addy) => {
        const newAddress = addy;
        const checksumAddress = toChecksumAddress(addy.address);
        if (checksumAddress !== addy.address) count++;
        newAddress.address = checksumAddress;
        return newAddress;
      });

      console.log(count);

      for (const addy of updatedAddresses) {
        const { id, address } = addy;
        const anotherOne = await queryInterface.sequelize.query(
          `SELECT * FROM "Addresses" WHERE address='${address}';`,
          { transaction }
        );
        console.log(anotherOne[0]);
        if (anotherOne[0].id !== undefined) {
          // delete cascade
          console.log(`failed to update: ${address}, ${id}`);
          await queryInterface.sequelize.query(
            `DELETE FROM "OffchainComments" WHERE address_id=${id};`,
            { transaction }
          );
          await queryInterface.sequelize.query(
            `DELETE FROM "OffchainThreads" WHERE address_id=${id};`,
            { transaction }
          );
          await queryInterface.sequelize.query(
            `DELETE FROM "OffchainReactions" WHERE address_id=${id};`,
            { transaction }
          );
          await queryInterface.sequelize.query(
            `DELETE FROM "Addresses" WHERE id=${id};`,
            { transaction }
          );
        } else {
          await queryInterface.sequelize.query(
            `UPDATE "Addresses" SET address='${address}' WHERE id=${id};`,
            { transaction }
          );
        }
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
    * Nothing to be done :)
    */
  }
};
