'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'GovernanceProposals',
        {
          eth_chain_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
          },
          proposal_id: {
            type: Sequelize.DECIMAL(78, 0),
            allowNull: false,
            primaryKey: true,
          },
          tx_hash: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          timestamp: {
            type: Sequelize.DECIMAL(78, 0),
            allowNull: false,
          },
          proposer_address: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          description: {
            type: Sequelize.TEXT,
            allowNull: false,
          },
          vote_start_timestamp: {
            type: Sequelize.DECIMAL(78, 0),
            allowNull: false,
          },
          vote_end_timestamp: {
            type: Sequelize.DECIMAL(78, 0),
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'ProposalVotes',
        {
          eth_chain_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
          },
          proposal_id: {
            type: Sequelize.DECIMAL(78, 0),
            primaryKey: true,
          },
          tx_hash: {
            type: Sequelize.STRING,
            allowNull: false,
            primaryKey: true,
          },
          timestamp: {
            type: Sequelize.DECIMAL(78, 0),
            allowNull: false,
          },
          // Field from CmnTokenVoteCast
          token_id: {
            type: Sequelize.DECIMAL(78, 0),
            allowNull: true, // nullable because address votes don't have token_id
          },
          // Field from CmnAddressVoteCast
          voter_address: {
            type: Sequelize.STRING,
            allowNull: true, // nullable because token votes don't have voter_address
          },
          support: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('ProposalVotes', {
        fields: ['eth_chain_id', 'proposal_id'],
        type: 'foreign key',
        name: 'proposal_votes_governance_proposals_fkey',
        references: {
          table: 'GovernanceProposals',
          fields: ['eth_chain_id', 'proposal_id'],
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        transaction,
      });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('ProposalVotes', { transaction });
      await queryInterface.dropTable('GovernanceProposals', { transaction });
    });
  },
};
