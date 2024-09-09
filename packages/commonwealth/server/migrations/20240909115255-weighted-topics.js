'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'Topics',
        'weighted_voting',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Topics',
        'chain_node_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'ChainNodes',
            key: 'id',
          },
          onUpdate: 'CASCADE',
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Topics',
        'token_address',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Topics',
        'token_symbol',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Topics',
        'vote_weight_multiplier',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        { transaction },
      );

      // delete duplicate ContestTopic entries to ensure that
      // all contests only associate with a single topic
      await queryInterface.sequelize.query(
        `
        DELETE FROM "ContestTopics"
        WHERE (contest_address, topic_id) NOT IN (
            SELECT contest_address, topic_id
            FROM "ContestTopics" AS ct1
            WHERE topic_id = (
                SELECT MIN(topic_id)
                FROM "ContestTopics" AS ct2
                WHERE ct1.contest_address = ct2.contest_address
            )
        );
      `,
        { transaction },
      );

      // ensure no duplicate ContestTopics by contest_address from now on
      await queryInterface.addConstraint('ContestTopics', {
        fields: ['contest_address'],
        type: 'unique',
        name: 'contest_topics_address_unique',
        transaction,
      });
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "ContestTopics"
        DROP CONSTRAINT contest_address_unique;
        `,
        { transaction },
      );

      // cannot restore deleted ContestTopics

      await queryInterface.removeColumn('Topics', 'weighted_voting', {
        transaction,
      });
      await queryInterface.removeColumn('Topics', 'chain_node_id', {
        transaction,
      });
      await queryInterface.removeColumn('Topics', 'token_address', {
        transaction,
      });
      await queryInterface.removeColumn('Topics', 'token_symbol', {
        transaction,
      });
      await queryInterface.removeColumn('Topics', 'vote_weight_multiplier', {
        transaction,
      });
    });
  },
};
