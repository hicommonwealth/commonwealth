'use strict';

const NEW_ADMIN_ID = 94;

module.exports = {
  up: (queryInterface, Sequelize) => {
    return new Promise((resolve) => resolve());
    // return queryInterface.bulkInsert('Roles', [
    //   {
    //     address_id: NEW_ADMIN_ID,
    //     offchain_community_id: null,
    //     chain_id: 'edgeware',
    //     created_at: new Date(),
    //     updated_at: new Date(),
    //     permission: 'admin'
    //   },
    //   {
    //     address_id: NEW_ADMIN_ID,
    //     offchain_community_id: 'edgeware-validators',
    //     chain_id: null,
    //     created_at: new Date(),
    //     updated_at: new Date(),
    //     permission: 'admin'
    //   },
    //   {
    //     address_id: NEW_ADMIN_ID,
    //     offchain_community_id: 'meta',
    //     chain_id: null,
    //     created_at: new Date(),
    //     updated_at: new Date(),
    //     permission: 'admin'
    //   },
    //   {
    //     address_id: NEW_ADMIN_ID,
    //     offchain_community_id: 'internal',
    //     chain_id: null,
    //     created_at: new Date(),
    //     updated_at: new Date(),
    //     permission: 'admin'
    //   }
    // ]);
  },

  down: async (queryInterface, Sequelize) => {
    return new Promise((resolve) => resolve());
    // await queryInterface.bulkDelete('Roles', [{
    //   address_id: NEW_ADMIN_ID,
    //   permission: 'admin',
    //   chain_id: 'edgeware',
    // }, {
    //   address_id: NEW_ADMIN_ID,
    //   permission: 'admin',
    //   offchain_community_id: 'edgeware-validators',
    // }, {
    //   address_id: NEW_ADMIN_ID,
    //   permission: 'admin',
    //   offchain_community_id: 'meta',
    // }, {
    //   address_id: NEW_ADMIN_ID,
    //   permission: 'admin',
    //   offchain_community_id: 'internal',
    // }]);
  },
};
