'use strict';

const defaultAvatars = [
  'https://assets.commonwealth.im/community-avatars/Frame+18.png',
  'https://assets.commonwealth.im/community-avatars/Frame+17.png',
  'https://assets.commonwealth.im/community-avatars/Frame+6.png',
  'https://assets.commonwealth.im/community-avatars/Frame+16.png',
  'https://assets.commonwealth.im/community-avatars/Frame+3.png',
  'https://assets.commonwealth.im/community-avatars/Frame+15.png',
  'https://assets.commonwealth.im/community-avatars/Frame+5.png',
  'https://assets.commonwealth.im/community-avatars/Frame+13.png',
  'https://assets.commonwealth.im/community-avatars/Frame+23.png',
  'https://assets.commonwealth.im/community-avatars/Frame+22.png',
  'https://assets.commonwealth.im/community-avatars/Frame+21.png',
  'https://assets.commonwealth.im/community-avatars/Frame+20.png',
  'https://assets.commonwealth.im/community-avatars/Frame+2.png',
  'https://assets.commonwealth.im/community-avatars/Frame+1.png',
];

function getRandomAvatar() {
  return defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Get communities without icons
      const communitiesWithoutIcons = await queryInterface.sequelize.query(
        `
        SELECT id FROM "Communities"
        WHERE "icon_url" IS NULL OR "icon_url" = ''
        `,
        { transaction, type: Sequelize.QueryTypes.SELECT },
      );

      // Update each community with a random avatar
      for (const community of communitiesWithoutIcons) {
        await queryInterface.sequelize.query(
          `
          UPDATE "Communities"
          SET "icon_url" = :avatar
          WHERE id = :communityId
          `,
          {
            transaction,
            replacements: {
              avatar: getRandomAvatar(),
              communityId: community.id,
            },
          },
        );
      }
    });
  },

  async down(queryInterface, Sequelize) {
    // No down migration needed as we only set icons for communities that didn't have one
  },
};
