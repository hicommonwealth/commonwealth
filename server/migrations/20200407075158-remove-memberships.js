'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // create roles from existing participation
      const addressChainAssociations = await queryInterface.sequelize.query(`
        SELECT DISTINCT address_id, chain as chain_id FROM (
          SELECT DISTINCT a.id as address_id, o.chain FROM "OffchainThreads" o
          JOIN "Addresses" a ON a.id = o.author_id
          WHERE o.community IS NULL AND o.deleted_at IS NULL AND a.verified IS NOT NULL
        UNION ALL
          SELECT DISTINCT a2.id as address_id, o2.chain FROM "OffchainComments" o2
          JOIN "Addresses" a2 ON a2.id = o2.address_id
          WHERE o2.community IS NULL AND o2.deleted_at IS NULL AND a2.verified IS NOT NULL
        ) t`);

      const addressPublicCommunityAssociations = await queryInterface.sequelize
        .query(`
        SELECT DISTINCT address_id, community as offchain_community_id FROM (
          SELECT DISTINCT a.id as address_id, o.community FROM "OffchainThreads" o
          JOIN "Addresses" a ON a.id = o.author_id
          JOIN "OffchainCommunities" c ON c.id = o.community
          WHERE c."privacyEnabled" = false AND o.deleted_at IS NULL AND a.verified IS NOT NULL
        UNION ALL
          SELECT DISTINCT a2.id as address_id, o2.community FROM "OffchainComments" o2
          JOIN "Addresses" a2 ON a2.id = o2.address_id
          JOIN "OffchainCommunities" c2 ON c2.id = o2.community
          WHERE c2."privacyEnabled" = false AND o2.deleted_at IS NULL AND a2.verified IS NOT NULL
        ) t`);

      const existingAddressChainRoles = await queryInterface.sequelize.query(`
        SELECT address_id, chain_id, offchain_community_id FROM "Roles" WHERE chain_id IS NOT NULL
      `);
      const existingAddressPublicCommunityRoles = await queryInterface.sequelize
        .query(`
        SELECT address_id, chain_id, offchain_community_id FROM "Roles" WHERE offchain_community_id IS NOT NULL
      `);

      const update = (associations) => {
        return associations.map((obj) =>
          Object.assign(obj, {
            permission: 'member',
            created_at: new Date(),
            updated_at: new Date(),
          })
        );
      };

      await Promise.all([
        addressChainAssociations[0].length > 0
          ? queryInterface.bulkInsert(
              'Roles',
              update(addressChainAssociations[0]),
              { transaction: t }
            )
          : null,
        addressPublicCommunityAssociations[0].length > 0
          ? queryInterface.bulkInsert(
              'Roles',
              update(addressPublicCommunityAssociations[0]),
              { transaction: t }
            )
          : null,
      ]);

      // we can drop the memberships table now
      return queryInterface.dropTable('Memberships');
    });
  },

  down: async (queryInterface, Sequelize) => {
    // repeat the create-memberships migration, followed by the populate-memberships migration
    await queryInterface.createTable('Memberships', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.INTEGER, allowNull: false },
      chain: { type: Sequelize.STRING, allowNull: true },
      community: { type: Sequelize.STRING, allowNull: true },
      active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    return queryInterface.sequelize.transaction(async (t) => {
      const userChainAssociations = await queryInterface.sequelize.query(`
    SELECT DISTINCT user_id, chain FROM (
      SELECT DISTINCT u.id as user_id, o.chain FROM "OffchainThreads" o
      JOIN "Addresses" a ON a.id = o.author_id
      JOIN "Users" u ON u.id = a.user_id
      WHERE o.community IS NULL AND o.deleted_at IS NULL AND a.verified IS NOT NULL
    UNION ALL
      SELECT DISTINCT u2.id as user_id, o2.chain FROM "OffchainComments" o2
      JOIN "Addresses" a2 ON a2.id = o2.address_id
      JOIN "Users" u2 ON u2.id = a2.user_id
      WHERE o2.community IS NULL AND o2.deleted_at IS NULL AND a2.verified IS NOT NULL
    ) t`);

      const userPublicCommunityAssociations = await queryInterface.sequelize
        .query(`
    SELECT DISTINCT user_id, community FROM (
      SELECT DISTINCT u.id as user_id, o.community FROM "OffchainThreads" o
      JOIN "Addresses" a ON a.id = o.author_id
      JOIN "Users" u ON u.id = a.user_id
      JOIN "OffchainCommunities" c ON c.id = o.community
      WHERE c."privacyEnabled" = false AND o.deleted_at IS NULL AND a.verified IS NOT NULL
    UNION ALL
      SELECT DISTINCT u2.id as user_id, o2.community FROM "OffchainComments" o2
      JOIN "Addresses" a2 ON a2.id = o2.address_id
      JOIN "Users" u2 ON u2.id = a2.user_id
      JOIN "OffchainCommunities" c2 ON c2.id = o2.community
      WHERE c2."privacyEnabled" = false AND o2.deleted_at IS NULL AND a2.verified IS NOT NULL
    ) t`);

      const userPrivateCommunityAssociations = await queryInterface.sequelize
        .query(`
    SELECT DISTINCT user_id, community FROM (
      SELECT DISTINCT u.id as user_id, o.community FROM "OffchainThreads" o
      JOIN "Addresses" a ON a.id = o.author_id
      JOIN "Users" u ON u.id = a.user_id
      JOIN "OffchainCommunities" c ON c.id = o.community
      JOIN "Roles" r ON r.address_id = a.id
      WHERE c."privacyEnabled" = true AND r.offchain_community_id = c.id
      AND o.deleted_at IS NULL AND a.verified IS NOT NULL
    UNION ALL
      SELECT DISTINCT u2.id as user_id, o2.community FROM "OffchainComments" o2
      JOIN "Addresses" a2 ON a2.id = o2.address_id
      JOIN "Users" u2 ON u2.id = a2.user_id
      JOIN "OffchainCommunities" c2 ON c2.id = o2.community
      JOIN "Roles" r2 ON r2.address_id = a2.id
      WHERE c2."privacyEnabled" = true AND r2.offchain_community_id = c2.id
      AND o2.deleted_at IS NULL AND a2.verified IS NOT NULL
    ) t`);

      const update = (associations) => {
        return associations.map((obj) =>
          Object.assign(obj, {
            active: true,
            created_at: new Date(),
            updated_at: new Date(),
          })
        );
      };

      return Promise.all([
        queryInterface.bulkInsert(
          'Memberships',
          update(userChainAssociations[0]),
          { transaction: t }
        ),
        queryInterface.bulkInsert(
          'Memberships',
          update(userPublicCommunityAssociations[0]),
          { transaction: t }
        ),
        queryInterface.bulkInsert(
          'Memberships',
          update(userPrivateCommunityAssociations[0]),
          { transaction: t }
        ),
      ]);
    });
  },
};
