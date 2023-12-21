'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // 16 MB index with only 4 uses (i.e. never used)
      await queryInterface.removeIndex(
        'Threads',
        'offchain_threads_updated_at',
        {
          transaction,
        },
      );

      await queryInterface.renameColumn('Threads', 'chain', 'community_id', {
        transaction,
      });

      // remove offchain prefixes and chain -> community_id
      await queryInterface.sequelize.query(
        `
        ALTER INDEX IF EXISTS "offchain_threads_chain" RENAME TO "threads_community_id";
      `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        ALTER INDEX IF EXISTS "offchain_threads_chain_pinned" RENAME TO "threads_community_id_pinned";
      `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Threads"
        RENAME CONSTRAINT "OffchainThreads_author_id_fkey" TO "Threads_author_id_fkey";
      `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        ALTER INDEX IF EXISTS "OffchainThreads_pkey" RENAME TO "Threads_pkey";
      `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        ALTER INDEX IF EXISTS "offchain_threads_chain_updated_at" RENAME TO "threads_community_id_updated_at";
      `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        ALTER INDEX IF EXISTS "offchain_threads_chain_created_at" RENAME TO "threads_community_id_created_at";
      `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        ALTER INDEX IF EXISTS "offchain_threads_author_id" RENAME TO "threads_author_id";
      `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        ALTER INDEX IF EXISTS "offchain_threads_created_at" RENAME TO "threads_created_at";
      `,
        { transaction },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addIndex('Threads', {
        fields: ['updated_at'],
        name: 'offchain_threads_updated_at',
        transaction,
      });

      await queryInterface.renameColumn('Threads', 'community_id', 'chain', {
        transaction,
      });

      // remove offchain prefixes and chain -> community_id
      await queryInterface.sequelize.query(
        `
        ALTER INDEX IF EXISTS "threads_community_id" RENAME TO "offchain_threads_chain";
      `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        ALTER INDEX IF EXISTS "threads_community_id_pinned" RENAME TO "offchain_threads_chain_pinned";
      `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Threads"
        RENAME CONSTRAINT "Threads_author_id_fkey" TO "OffchainThreads_author_id_fkey";
      `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        ALTER INDEX IF EXISTS "Threads_pkey" RENAME TO "OffchainThreads_pkey";
      `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        ALTER INDEX IF EXISTS "threads_community_id_updated_at" RENAME TO "offchain_threads_chain_updated_at";
      `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        ALTER INDEX IF EXISTS "threads_community_id_created_at" RENAME TO "offchain_threads_chain_created_at";
      `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        ALTER INDEX IF EXISTS "threads_author_id" RENAME TO "offchain_threads_author_id";
      `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        ALTER INDEX IF EXISTS "threads_created_at" RENAME TO "offchain_threads_created_at";
      `,
        { transaction },
      );
    });
  },
};
