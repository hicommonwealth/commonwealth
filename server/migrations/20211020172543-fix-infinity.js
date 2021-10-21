'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {

    return queryInterface.sequelize.transaction(async (t) => {
      // Fix OffchainCommunity Model id to "infinity" from "nft-co"
      await queryInterface.bulkUpdate(
        'OffchainCommunities',
        {
          id: 'infinity'
        }, { // WHERE
          id: 'nft-co'
        },
        { transaction: t }
      );
      await queryInterface.bulkUpdate(
        'OffchainReactions',
        {
          community: 'infinity'
        }, { // WHERE
          community: 'nft-co'
        },
        { transaction: t }
      );
      // Fix Roles Offchain_community_id to be "infinity" for "nft-co"
      await queryInterface.bulkUpdate(
        'Roles',
        {
          offchain_community_id: 'infinity'
        }, { // WHERE
          offchain_community_id: 'nft-co'
        },
        { transaction: t }
      );

      // Fix Offchain Threads
      await queryInterface.bulkUpdate(
        'OffchainThreads',
        {
          community: 'infinity'
        }, { // WHERE
          commmunity: 'nft-co'
        },
        { transaction: t }
      );

      // Fix Offchain Topics
      await queryInterface.bulkUpdate(
        'OffchainThreads',
        {
          community_id: 'infinity'
        }, { // WHERE
          commmunity_id: 'nft-co'
        },
        { transaction: t }
      );


    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkUpdate(
        'OffchainReactions',
        {
          community: 'nft-co'
        }, { // WHERE
          community: 'infinity'
        },
        { transaction: t }
      );
      // Fix OffchainCommunity Model id to "infinity" from "nft-co"
      await queryInterface.bulkUpdate(
        'OffchainCommunities',
        {
          id: 'nft-co'
        }, { // WHERE
          id: 'infinity'
        },
        { transaction: t }
      );

      // Fix Roles Offchain_community_id to be "infinity" for "nft-co"
      await queryInterface.bulkUpdate(
        'Roles',
        {
          offchain_community_id: 'nft-co'
        }, { // WHERE
          offchain_community_id: 'infinity'
        },
        { transaction: t }
      );

      // Fix Offchain Threads
      await queryInterface.bulkUpdate(
        'OffchainThreads',
        {
          community: 'nft-co'
        }, { // WHERE
          commmunity: 'infinity'
        },
        { transaction: t }
      );

      // Fix Offchain Topics
      await queryInterface.bulkUpdate(
        'OffchainThreads',
        {
          community_id: 'nft-co'
        }, { // WHERE
          commmunity_id: 'infinity'
        },
        { transaction: t }
      );
    });
  }
};
