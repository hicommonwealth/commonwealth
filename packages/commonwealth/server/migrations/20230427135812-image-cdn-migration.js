'use strict';

/* eslint-disable max-len */

async function replaceImageWithCdn(
  queryInterface,
  tableName,
  fieldName,
  transaction
) {
  await queryInterface.sequelize.query(
    `UPDATE "${tableName}" SET "${fieldName}" = 
     regexp_replace(${fieldName}, '.*commonwealth-uploads.s3.us-east-2.amazonaws.com/(.*)', 'https://assets.commonwealth.im/\\1')`,
    { transaction }
  );
}

async function replaceImageWithCdnRollToken(
  queryInterface,
  tableName,
  fieldName,
  transaction
) {
  await queryInterface.sequelize.query(
    `UPDATE "${tableName}" SET "${fieldName}" = 
     regexp_replace(${fieldName}, '.*roll-token.s3.amazonaws.com/(.*)', 'https://assets.commonwealth.im/\\1')`,
    { transaction }
  );
}

async function reverseReplaceImageWithCdn(
  queryInterface,
  tableName,
  fieldName,
  transaction
) {
  await queryInterface.sequelize.query(
    `UPDATE "${tableName}" SET "${fieldName}" = 
     regexp_replace(${fieldName}, 'https://assets.commonwealth.im/(.*)', 'https://commonwealth-uploads.s3.us-east-2.amazonaws.com/\\1')`,
    { transaction }
  );
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await Promise.all([
        replaceImageWithCdn(queryInterface, 'Chains', 'icon_url', t),
        replaceImageWithCdn(queryInterface, 'Profiles', 'avatar_url', t),
        replaceImageWithCdn(queryInterface, 'Attachments', 'url', t),
        replaceImageWithCdnRollToken(queryInterface, 'Tokens', 'icon_url', t),
      ]);
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await Promise.all([
        reverseReplaceImageWithCdn(queryInterface, 'Chains', 'icon_url', t),
        reverseReplaceImageWithCdn(queryInterface, 'Profiles', 'avatar_url', t),
        reverseReplaceImageWithCdn(queryInterface, 'Attachments', 'url', t),
      ]);
    });
  },
};
