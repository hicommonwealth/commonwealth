'use strict';
const _ = require('lodash');
const { decodeAddress, encodeAddress } = require('@polkadot/util-crypto');

const reEncode = (a, nId) => {
  let decoded;
  try {
    decoded = decodeAddress(a.address);
  } catch (e) {
    console.log('Failed to decode address, skipping:\n', a);
    return null;
  }

  try {
    return encodeAddress(decoded, nId);
  } catch (d) {
    console.log('Failed to encode address, skipping:\n', a);
    return null;
  }
};

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize
      .query('SELECT * FROM "Addresses"', {
        type: queryInterface.sequelize.QueryTypes.SELECT,
      })
      .then((addresses) => {
        return addresses
          .map((a) => {
            let address;
            if (a.chain === 'edgeware') {
              address = reEncode(a, 7);
            } else if (a.chain === 'kusama') {
              address = reEncode(a, 2);
            } else if (a.chain === 'substrate') {
              address = reEncode(a, 42);
            }
            return { id: a.id, address };
          })
          .filter((a) => !!a.address);
      })
      .then(async (addresses) => {
        const counts = _.countBy(addresses, (a) => a.address);
        const duplicateAddrs = Object.entries(counts).filter(
          ([addr, count]) => count > 1
        );
        console.log(
          'skipping addresses with conflicting encodings:',
          duplicateAddrs
        );
        const migratingAddrs = addresses.filter(
          (a) => duplicateAddrs.indexOf(a.address) === -1
        );

        for (const r of migratingAddrs) {
          try {
            await queryInterface.sequelize.query(
              `UPDATE "Addresses" SET address = ? WHERE id = ?`,
              {
                replacements: [r.address, r.id],
              }
            );
          } catch (e) {
            console.error('Failed to migrate:', r.id, r.address);
          }
        }
        return;
      });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize
      .query('SELECT * FROM "Addresses"', {
        type: queryInterface.sequelize.QueryTypes.SELECT,
      })
      .then((addresses) => {
        return addresses
          .map((a) => {
            let address;
            if (a.chain === 'edgeware') {
              address = reEncode(a, 42);
            } else if (a.chain === 'kusama') {
              address = reEncode(a, 42);
            } else if (a.chain === 'substrate') {
              address = reEncode(a, 42);
            }
            return { id: a.id, address };
          })
          .filter((a) => !!a.address);
      })
      .then(async (addresses) => {
        const counts = _.countBy(addresses, (a) => a.address);
        const duplicateAddrs = Object.entries(counts).filter(
          ([addr, count]) => count > 1
        );
        console.log(
          'skipping addresses with conflicting encodings:',
          duplicateAddrs
        );
        const migratingAddrs = addresses.filter(
          (a) => duplicateAddrs.indexOf(a.address) === -1
        );

        for (const r of migratingAddrs) {
          try {
            await queryInterface.sequelize.query(
              `UPDATE "Addresses" SET address = ? WHERE id = ?`,
              {
                replacements: [r.address, r.id],
              }
            );
          } catch (e) {
            console.error('Failed to migrate:', r.id, r.address);
          }
        }
      });
  },
};
