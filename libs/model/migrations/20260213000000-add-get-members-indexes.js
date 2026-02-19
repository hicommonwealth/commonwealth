'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface) {
    const { sequelize } = queryInterface;
    // CONCURRENTLY cannot run inside a transaction; run without transaction for production safety.
    await sequelize.query(
      `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS addresses_community_id_user_id_idx
      ON public."Addresses" (community_id, user_id);
      `,
    );
    await sequelize.query(
      `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS users_profile_name_btree_idx
      ON public."Users" (((profile->>'name')) DESC NULLS LAST);
      `,
    );
  },

  async down(queryInterface) {
    const { sequelize } = queryInterface;
    await sequelize.query(
      `DROP INDEX CONCURRENTLY IF EXISTS addresses_community_id_user_id_idx;`,
    );
    await sequelize.query(
      `DROP INDEX CONCURRENTLY IF EXISTS users_profile_name_btree_idx;`,
    );
  },
};
