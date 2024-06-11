'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      const duplicateChainRolesQuery = await queryInterface.sequelize.query(
        'SELECT address_id, chain_id, COUNT(*), ARRAY_AGG(DISTINCT "Roles".permission), ARRAY_AGG(id) as ids ' +
          'FROM "Roles" WHERE offchain_community_id IS NULL ' +
          'GROUP BY address_id, chain_id HAVING COUNT(*) > 1'
      );
      const duplicateCommunityRolesQuery = await queryInterface.sequelize.query(
        'SELECT address_id, offchain_community_id, COUNT(*), ARRAY_AGG(DISTINCT "Roles".permission), ARRAY_AGG(id) as ids ' +
          'FROM "Roles" WHERE chain_id IS NULL ' +
          'GROUP BY address_id, offchain_community_id HAVING COUNT(*) > 1'
      );

      const chainRoleIdsToDelete = duplicateChainRolesQuery[0].reduce(
        (acc, fields) => acc.concat(fields.ids),
        []
      );
      const communityRoleIdsToDelete = duplicateCommunityRolesQuery[0].reduce(
        (acc, fields) => acc.concat(fields.ids),
        []
      );
      if (chainRoleIdsToDelete.length > 0) {
        await queryInterface.bulkDelete(
          'Roles',
          { id: chainRoleIdsToDelete },
          { transaction: t }
        );
      }
      if (communityRoleIdsToDelete.length > 0) {
        await queryInterface.bulkDelete(
          'Roles',
          { id: communityRoleIdsToDelete },
          { transaction: t }
        );
      }

      const processQueryFields = (fields) => {
        fields.permission =
          fields.array_agg.indexOf('admin') !== -1
            ? 'admin'
            : fields.array_agg.indexOf('moderator') !== -1
            ? 'moderator'
            : 'member';
        delete fields.ids;
        delete fields.count;
        delete fields.array_agg;
        fields.created_at = new Date();
        fields.updated_at = new Date();
        return fields;
      };

      const duplicateChainRoles =
        duplicateChainRolesQuery[0].map(processQueryFields);
      const duplicateCommunityRoles =
        duplicateCommunityRolesQuery[0].map(processQueryFields);
      if (duplicateChainRoles.length > 0) {
        await queryInterface.bulkInsert('Roles', duplicateChainRoles, {
          transaction: t,
        });
      }
      if (duplicateCommunityRoles.length > 0) {
        await queryInterface.bulkInsert('Roles', duplicateCommunityRoles, {
          transaction: t,
        });
      }
    });

    await queryInterface.removeIndex(
      'Roles',
      'roles_address_id_chain_id_offchain_community_id'
    );
    await queryInterface.addIndex('Roles', {
      fields: ['address_id', 'chain_id'],
      unique: true,
    });
    await queryInterface.addIndex('Roles', {
      fields: ['address_id', 'offchain_community_id'],
      unique: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('Roles', 'roles_address_id_chain_id');
    await queryInterface.removeIndex(
      'Roles',
      'roles_address_id_offchain_community_id'
    );
    await queryInterface.addIndex('Roles', {
      fields: ['address_id', 'chain_id', 'offchain_community_id'],
    });
  },
};
