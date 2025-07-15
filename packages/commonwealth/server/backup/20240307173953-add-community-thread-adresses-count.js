'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'Communities',
        'thread_count',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Communities',
        'address_count',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        { transaction },
      );

      // Set community thread_count
      await queryInterface.sequelize.query(
        `
        ;with threadCntByCommunity AS (
          SELECT
            count(id) as cnt,
            community_id
          FROM "Threads"
          WHERE deleted_at IS NULL
          GROUP BY community_id
        )

        Update "Communities"
        SET thread_count=cc.cnt
        FROM threadCntByCommunity cc
        where cc.community_id="Communities".id
        `,
        { transaction },
      );

      // Set community address_count
      await queryInterface.sequelize.query(
        `
        ;with addressCntByCommunity AS (
          SELECT
            count(id) as cnt,
            community_id
          FROM "Addresses"
          WHERE verified IS NOT NULL
          GROUP BY community_id
        )

        Update "Communities"
        SET address_count=cc.cnt
        FROM addressCntByCommunity cc
        where cc.community_id="Communities".id
        `,
        { transaction },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('Communities', 'thread_count', {
        transaction,
      });

      await queryInterface.removeColumn('Communities', 'address_count', {
        transaction,
      });
    });
  },
};
