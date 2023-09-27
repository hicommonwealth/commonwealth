'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      const chain = await queryInterface.sequelize.query(
        `
        INSERT INTO "Chains" (
          id, 
          type,  
          name, 
          active,
          network, 
          default_symbol, 
          base, 
          collapsed_on_homepage, 
          has_chain_events_listener, 
          custom_stages,
          stages_enabled,
          chain_node_id,
          has_homepage,
          default_page,
          created_at, 
          updated_at
        ) 
        VALUES (
          'logline', 
          'offchain', 
          'logline',
          TRUE,
          'ethereum', 
          'LOG', 
          'ethereum', 
          TRUE, 
          FALSE,  
          TRUE,
          TRUE,
          37,
          TRUE,
          'homepage',
          NOW(), 
          NOW()
        ) 
        ON CONFLICT (id) DO NOTHING 
        RETURNING *;
        `,
        { transaction }
      );

      const user = await queryInterface.bulkInsert(
        'Users',
        [
          {
            email: 'TODO', // TODO: Choose the email
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { returning: true, transaction }
      );

      const userId = user[0].id;

      const profile = await queryInterface.bulkInsert(
        'Profiles',
        [
          {
            profile_name: 'Farcaster Bot',
            user_id: userId,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { returning: true, transaction }
      );

      const profileId = profile[0].id;

      // Assumes a starter community "logline" already exists
      await queryInterface.bulkInsert(
        'Addresses',
        [
          {
            address: '0xfarcasterbot',
            user_id: userId,
            profile_id: profileId,
            chain: 'logline',
            role: 'admin',
            verification_token: '123456',
            verification_token_expires: new Date(2030, 1, 1),
            verified: new Date(),
            last_active: new Date(),
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      // 1. Rename the column
      await queryInterface.renameColumn('Threads', 'discord_meta', 'bot_meta', {
        transaction,
      });
      await queryInterface.renameColumn(
        'Comments',
        'discord_meta',
        'bot_meta',
        { transaction }
      );

      // 2. Update the content using PostgreSQL's JSON functions
      await queryInterface.sequelize.query(
        `
        UPDATE "Threads"
        SET bot_meta = bot_meta::jsonb || '{"bot_type": "discord"}'::jsonb 
        WHERE bot_meta IS NOT NULL
      `,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `
        UPDATE "Comments"
        SET bot_meta = bot_meta::jsonb || '{"bot_type": "discord"}'::jsonb 
        WHERE bot_meta IS NOT NULL
      `,
        { transaction }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      const profiles = await queryInterface.sequelize.query(
        `SELECT * FROM "Profiles" WHERE profile_name = 'Farcaster Bot'`,
        { transaction }
      );
      const profile = profiles[0][0];

      if (profile) {
        const profileId = profile.id;
        const userId = profile.user_id;

        await queryInterface.bulkDelete(
          'Profiles',
          { id: profileId },
          { transaction }
        );

        await queryInterface.bulkDelete(
          'Users',
          { id: userId },
          { transaction }
        );
      }

      await queryInterface.renameColumn('Threads', 'bot_meta', 'discord_meta', {
        transaction,
      });
      await queryInterface.renameColumn(
        'Comments',
        'bot_meta',
        'discord_meta',
        { transaction }
      );

      // 2. Remove the bot_type key from the JSON using PostgreSQL's JSON functions
      await queryInterface.sequelize.query(
        `
      UPDATE "Threads" 
      SET discord_meta = discord_meta::jsonb - 'bot_type' 
      WHERE discord_meta IS NOT NULL
    `,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `
      UPDATE "Comments" 
      SET discord_meta = discord_meta::jsonb - 'bot_type' 
      WHERE discord_meta IS NOT NULL
    `,
        { transaction }
      );
    });
  },
};
