'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      UPDATE public."Users" u
      SET
        wallet_verified = true,
        tier = CASE
                 WHEN u.social_verified = true
                   AND u.chain_verified = true
                   THEN 6
                 ELSE u.tier
          END
      FROM (
             SELECT DISTINCT ON (a.user_id)
               a.user_id,
               a.last_active
             FROM public."Addresses" a
             WHERE a.user_id IS NOT NULL
               AND a.last_active IS NOT NULL
             ORDER BY a.user_id, a.last_active DESC
           ) latest_address
      WHERE u.id = latest_address.user_id
        AND u.wallet_verified = false
        AND latest_address.last_active >= u.created_at + INTERVAL '1 week';
    `);
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
