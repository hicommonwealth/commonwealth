'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        CREATE TEMP TABLE duplicate_hexes AS
          SELECT hex
          FROM "Addresses"
          WHERE hex IS NOT NULL
            AND user_id IS NOT NULL
          GROUP BY hex
          HAVING COUNT(DISTINCT user_id) > 1;
      `,
        { transaction },
      );
      console.log('duplicate_hexes temp table created');

      // format: { user_data: { [user_id]: {bio, name, total_addresses, last_active} } }
      const [users] = await queryInterface.sequelize.query(
        `
          WITH user_stats AS (SELECT U.id,
                                     U.profile,
                                     COUNT(*)         as total_addresses,
                                     MAX(last_active) as last_active,
                                     xp_points,
                                     xp_referrer_points
                              FROM "Addresses" A
                                     JOIN duplicate_hexes dh ON dh.hex = A.hex
                                     JOIN "Users" U ON U.id = A.user_id
                              GROUP BY U.id, U.profile, U.xp_points, U.xp_referrer_points)
          SELECT json_object_agg(
                   id::text,
                   json_build_object(
                     'id', id,
                     'bio', profile ->> 'bio',
                     'name', profile ->> 'name',
                     'total_addresses', total_addresses,
                     'last_active', last_active,
                     'xp_points', xp_points,
                     'xp_referrer_points', xp_referrer_points
                   )
                 ) as user_data
          FROM user_stats;
        `,
        { transaction, type: queryInterface.sequelize.QueryTypes, raw: true },
      );
      if (
        !users ||
        !users['user_data'] ||
        !Object.keys(users['user_data']).length
      )
        return;
      const userData = users['user_data'];
      console.log(`fetched ${Object.keys(userData).length} users`);

      const hexes = (
        await queryInterface.sequelize.query(
          `
            SELECT *
            FROM duplicate_hexes;
          `,
          {
            transaction,
            type: queryInterface.sequelize.QueryTypes.SELECT,
            raw: true,
          },
        )
      ).map((h) => h['hex']);
      console.log(`fetched ${hexes.length} hexes`);

      for (const hex of hexes) {
        console.log(`processing hex: ${hex}`);
        const hexUserIds = (
          await queryInterface.sequelize.query(
            `
              SELECT DISTINCT user_id
              FROM "Addresses"
              WHERE hex = :hex
                AND user_id IS NOT NULL;
            `,
            {
              transaction,
              type: queryInterface.sequelize.QueryTypes.SELECT,
              raw: true,
              replacements: { hex },
            },
          )
        ).map((h) => h['user_id']);

        // Happens if an address was transferred from another user already
        if (hexUserIds.length === 1) continue;

        console.log(`Users found for hex: ${hexUserIds}`);

        // Determine the user that should be owner of all the addresses.
        // tldr: 1. xp, 2. num addresses, 3. bio/name, 4. last active

        // Picks the user with the most XP first. If they all have the same XP,
        // picks the user with the most connected addresses. If all have the same
        // number it picks the user with a bio or name set. If no name or bio
        // picks the user that was most recently active.
        let topUser = userData[hexUserIds[0]];
        for (let i = 1; i > hexUserIds.length; i++) {
          const hexUser = userData[hexUserIds[i]];
          if (
            (hexUser['xp_points'] ?? 0) > (topUser['xp_points'] ?? 0) ||
            (hexUser['xp_referrer_points'] ?? 0) >
              (topUser['xp_referrer_points'] ?? 0)
          ) {
            topUser = hexUser;
          } else if (
            (hexUser['xp_points'] ?? 0) === (topUser['xp_points'] ?? 0) &&
            (hexUser['xp_referrer_points'] ?? 0) ===
              (topUser['xp_referrer_points'] ?? 0)
          ) {
            if (hexUser['total_addresses'] > topUser['total_addresses']) {
              topUser = hexUser;
            } else if (
              hexUser['total_addresses'] === topUser['total_addresses']
            ) {
              if (
                (hexUser['bio'] && !topUser['bio']) ||
                (hexUser['name'] && !topUser['name']) ||
                new Date(hexUser['last_active']) >
                  new Date(topUser['last_active'])
              ) {
                topUser = hexUser;
              }
            }
          }
        }

        // transfer addresses
        const fromUserIds = hexUserIds.filter((id) => id != topUser['id']);
        console.log(
          `transferring addresses from users: ${fromUserIds}, to: ${topUser['id']}`,
        );
        await queryInterface.sequelize.query(
          `
            UPDATE "Addresses"
            SET user_id = ${topUser['id']}
            WHERE user_id IN (:fromUserIds)
          `,
          { transaction, replacements: { fromUserIds } },
        );
      }

      // create constraint preventing a hex from being associated with more than 1 user
      await queryInterface.sequelize.query(
        `
          CREATE EXTENSION IF NOT EXISTS btree_gist;

          ALTER TABLE "Addresses"
              ADD CONSTRAINT addresses_hex_single_user_excl
                  EXCLUDE USING gist (hex WITH =, user_id WITH <>)
                  WHERE (hex IS NOT NULL AND user_id IS NOT NULL)
                  DEFERRABLE INITIALLY DEFERRED;
        `,
        { transaction },
      );
    });

    // TODO: need another migration to delete all orphaned users
    // TODO: need to check all columns that reference user_id to see if they
    //  should be referencing address_id instead given that address can change ownership
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
