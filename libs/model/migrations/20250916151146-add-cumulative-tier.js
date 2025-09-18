'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Update Users.tier: bump tier 6->7, 7->8
      await queryInterface.sequelize.query(
        `UPDATE "Users" 
         SET tier = CASE 
           WHEN tier = 6 THEN 7
           WHEN tier = 7 THEN 8
           ELSE tier
         END 
         WHERE tier IN (6, 7);`,
        { transaction },
      );

      // Update Threads.user_tier_at_creation: bump tier 6->7, 7->8
      await queryInterface.sequelize.query(
        `UPDATE "Threads" 
         SET user_tier_at_creation = CASE 
           WHEN user_tier_at_creation = 6 THEN 7
           WHEN user_tier_at_creation = 7 THEN 8
           ELSE user_tier_at_creation
         END 
         WHERE user_tier_at_creation IN (6, 7);`,
        { transaction },
      );

      // Update Reactions.user_tier_at_creation: bump tier 6->7, 7->8
      await queryInterface.sequelize.query(
        `UPDATE "Reactions" 
         SET user_tier_at_creation = CASE 
           WHEN user_tier_at_creation = 6 THEN 7
           WHEN user_tier_at_creation = 7 THEN 8
           ELSE user_tier_at_creation
         END 
         WHERE user_tier_at_creation IN (6, 7);`,
        { transaction },
      );

      // Update Comments.user_tier_at_creation: bump tier 6->7, 7->8
      await queryInterface.sequelize.query(
        `UPDATE "Comments" 
         SET user_tier_at_creation = CASE 
           WHEN user_tier_at_creation = 6 THEN 7
           WHEN user_tier_at_creation = 7 THEN 8
           ELSE user_tier_at_creation
         END 
         WHERE user_tier_at_creation IN (6, 7);`,
        { transaction },
      );

      await queryInterface.addColumn(
        'Users',
        'wallet_verified',
        {
          type: Sequelize.BOOLEAN,
          allowNull: true,
          defaultValue: false,
        },
        { transaction },
      );
      await queryInterface.addColumn(
        'Users',
        'social_verified',
        {
          type: Sequelize.BOOLEAN,
          allowNull: true,
          defaultValue: false,
        },
        { transaction },
      );
      await queryInterface.addColumn(
        'Users',
        'chain_verified',
        {
          type: Sequelize.BOOLEAN,
          allowNull: true,
          defaultValue: false,
        },
        { transaction },
      );
      await queryInterface.addColumn(
        'Users',
        'manually_verified',
        {
          type: Sequelize.BOOLEAN,
          allowNull: true,
          defaultValue: false,
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        UPDATE "Users"
        SET wallet_verified = true
        FROM "Addresses" A
        WHERE A.user_id = "Users".id
          AND "Users".created_at + INTERVAL '1 week' > A.last_active;
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        UPDATE "Users"
        SET social_verified = true
        FROM "Addresses" A
        WHERE A.user_id = "Users".id
          AND A.wallet_id = 'magic';
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        WITH users AS (
          -- Users who have launched a token
          SELECT U.id as user_id, U.tier as tier, LT.created_at as txn_at
          FROM "Users" U
                 JOIN "Addresses" A ON A.user_id = U.id
                 JOIN "LaunchpadTokens" LT ON LOWER(LT.creator_address) = LOWER(A.address)
          WHERE LT.creator_address IS NOT NULL AND A.is_banned = false AND A.user_id IS NOT NULL
          GROUP BY U.id, U.tier, LT.token_address, LT.created_at

          UNION ALL

          -- Users who have traded tokens
          SELECT U.id as user_id, U.tier as tier, to_timestamp(LT.timestamp) as txn_at
          FROM "Users" U
                 JOIN "Addresses" A ON A.user_id = U.id
                 JOIN "LaunchpadTrades" LT ON LOWER(LT.trader_address) = LOWER(A.address)
          WHERE A.is_banned = false AND A.user_id IS NOT NULL
          GROUP BY U.id, U.tier, LT.token_address, LT.timestamp

          UNION ALL

          -- Users who have traded stake
          SELECT U.id as user_id, U.tier as tier, to_timestamp(ST.timestamp) as txn_at
          FROM "Users" U
                 JOIN "Addresses" A ON A.user_id = U.id
                 JOIN "StakeTransactions" ST ON LOWER(ST.address) = LOWER(A.address)
          WHERE A.is_banned = false AND A.user_id IS NOT NULL
          GROUP BY U.id, U.tier, to_timestamp(ST.timestamp)

          UNION ALL

          -- Users who have created contest managers
          SELECT U.id as user_id, U.tier as tier, CM.created_at as txn_at
          FROM "Users" U
                 JOIN "Addresses" A ON A.user_id = U.id
                 JOIN "ContestManagers" CM ON LOWER(CM.creator_address) = LOWER(A.address)
          WHERE A.is_banned = false AND A.user_id IS NOT NULL
          GROUP BY U.id, U.tier, CM.created_at

          UNION ALL

          -- Users who have created a namespace
          SELECT U.id as user_id, U.tier as tier, C.created_at as txn_at
          FROM "Users" U
                 JOIN "Addresses" A ON A.user_id = U.id
                 JOIN "Communities" C ON LOWER(C.namespace_creator_address) = LOWER(A.address)
          WHERE A.is_banned = false AND A.user_id IS NOT NULL
          GROUP BY U.id, U.tier, C.created_at
        ),
             users_with_txns AS (
               SELECT user_id, MAX(txn_at) as last_txn_at
               FROM users
               GROUP BY user_id
             )
        UPDATE "Users"
        SET chain_verified = true
        FROM users_with_txns uwt
        WHERE uwt.user_id = "Users".id;
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        UPDATE "Users"
        SET tier = 3
        WHERE wallet_verified = true;
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        UPDATE "Users"
        SET tier = 4
        WHERE social_verified = true;
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        UPDATE "Users"
        SET tier = 5
        WHERE chain_verified = true
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        UPDATE "Users"
        SET tier = 6
        WHERE wallet_verified = true AND social_verified = true AND chain_verified = true;
      `,
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Revert Users.tier: bump tier 7->6, 8->7
      await queryInterface.sequelize.query(
        `UPDATE "Users" 
         SET tier = CASE 
           WHEN tier = 7 THEN 6
           WHEN tier = 8 THEN 7
           ELSE tier
         END 
         WHERE tier IN (7, 8);`,
        { transaction },
      );

      // Revert Threads.user_tier_at_creation: bump tier 7->6, 8->7
      await queryInterface.sequelize.query(
        `UPDATE "Threads" 
         SET user_tier_at_creation = CASE 
           WHEN user_tier_at_creation = 7 THEN 6
           WHEN user_tier_at_creation = 8 THEN 7
           ELSE user_tier_at_creation
         END 
         WHERE user_tier_at_creation IN (7, 8);`,
        { transaction },
      );

      // Revert Reactions.user_tier_at_creation: bump tier 7->6, 8->7
      await queryInterface.sequelize.query(
        `UPDATE "Reactions" 
         SET user_tier_at_creation = CASE 
           WHEN user_tier_at_creation = 7 THEN 6
           WHEN user_tier_at_creation = 8 THEN 7
           ELSE user_tier_at_creation
         END 
         WHERE user_tier_at_creation IN (7, 8);`,
        { transaction },
      );

      // Revert Comments.user_tier_at_creation: bump tier 7->6, 8->7
      await queryInterface.sequelize.query(
        `UPDATE "Comments" 
         SET user_tier_at_creation = CASE 
           WHEN user_tier_at_creation = 7 THEN 6
           WHEN user_tier_at_creation = 8 THEN 7
           ELSE user_tier_at_creation
         END 
         WHERE user_tier_at_creation IN (7, 8);`,
        { transaction },
      );
    });
  },
};
