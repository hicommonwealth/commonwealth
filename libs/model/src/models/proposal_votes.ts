import { ProposalVote } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod';
import type { ModelInstance } from './types';

export type ProposalVoteAttributes = z.infer<typeof ProposalVote>;

export type ProposalVoteInstance = ModelInstance<ProposalVoteAttributes>;

export type ProposalVoteModelStatic =
  Sequelize.ModelStatic<ProposalVoteInstance>;

export default (sequelize: Sequelize.Sequelize): ProposalVoteModelStatic =>
  <ProposalVoteModelStatic>sequelize.define<ProposalVoteInstance>(
    'ProposalVote',
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
      token_id: {
        type: Sequelize.DECIMAL(78, 0),
        allowNull: true,
      },
      voter_address: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      support: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
    },
    {
      timestamps: false,
      tableName: 'ProposalVotes',
      underscored: true,
    },
  );
