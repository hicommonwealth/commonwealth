'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      // remove any contest managers and associated entities that don't have a topic
      await queryInterface.sequelize.query(
        `
        DELETE FROM "ContestActions" ca
        USING "Contests" c, "ContestManagers" cm
        WHERE ca.contest_address = c.contest_address
          AND ca.contest_id = c.contest_id
          AND c.contest_address = cm.contest_address
          AND NOT EXISTS (
            SELECT 1
            FROM "ContestTopics" ct
            WHERE ct.contest_address = cm.contest_address
          );
    `,
        { transaction: t },
      );

      await queryInterface.sequelize.query(
        `
        DELETE FROM "Contests" c
        USING "ContestManagers" cm
        WHERE c.contest_address = cm.contest_address
          AND NOT EXISTS (
            SELECT 1
            FROM "ContestTopics" ct
            WHERE ct.contest_address = cm.contest_address
          );
    `,
        { transaction: t },
      );

      await queryInterface.sequelize.query(
        `
        DELETE FROM "ContestManagers" cm
        WHERE NOT EXISTS (
            SELECT 1
            FROM "ContestTopics" ct
            WHERE ct.contest_address = cm.contest_address
        );
    `,
        { transaction: t },
      );

      // move topic associate to ContestManagers table
      await queryInterface.addColumn(
        'ContestManagers',
        'topic_id',
        {
          type: Sequelize.INTEGER,
          references: {
            model: 'Topics',
            key: 'id',
          },
        },
        { transaction: t },
      );

      await queryInterface.sequelize.query(
        `
        UPDATE "ContestManagers" cm
        SET topic_id = subquery.topic_id
        FROM (
          SELECT ct.contest_address, ct.topic_id
          FROM "ContestTopics" ct
          JOIN (
            SELECT contest_address, MAX(created_at) AS latest_created_at
            FROM "ContestTopics"
            GROUP BY contest_address
          ) recent_ct
          ON ct.contest_address = recent_ct.contest_address
          AND ct.created_at = recent_ct.latest_created_at
        ) AS subquery
        WHERE cm.contest_address = subquery.contest_address;
      `,
        { transaction: t },
      );

      // do not allow null topic
      await queryInterface.changeColumn(
        'ContestManagers',
        'topic_id',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'Topics',
            key: 'id',
          },
        },
        { transaction: t },
      );

      await queryInterface.dropTable('ContestTopics', { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.createTable(
        'ContestTopics',
        {
          contest_address: {
            type: Sequelize.STRING(255),
            allowNull: false,
            unique: true,
            references: {
              model: 'ContestManagers',
              key: 'contest_address',
            },
          },
          topic_id: {
            type: Sequelize.INTEGER,
            references: {
              model: 'Topics',
              key: 'id',
            },
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
          },
        },
        { transaction: t },
      );

      await queryInterface.removeColumn('ContestManagers', 'topic_id', {
        transaction: t,
      });
    });
  },
};
