'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex(
        'Memberships',
        'memberships_address_id_group_id',
        { transaction },
      );
      await queryInterface.removeIndex(
        'Memberships',
        'memberships_address_id',
        { transaction },
      );
      await queryInterface.removeIndex(
        'CommunityTags',
        'community_tags_community_id',
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addIndex(
        'Memberships',
        {
          name: 'memberships_address_id_group_id',
          fields: ['address_id', 'group_id'],
          unique: true,
        },
        { transaction },
      );
      await queryInterface.addIndex(
        'Memberships',
        {
          name: 'memberships_address_id',
          fields: ['address_id'],
        },
        { transaction },
      );
      await queryInterface.addIndex(
        'CommunityTags',
        {
          name: 'community_tags_community_id',
          fields: ['community_id'],
        },
        { transaction },
      );
    });
  },
};
