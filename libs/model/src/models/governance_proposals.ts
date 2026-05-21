import { GovernanceProposal } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod';
import type { ModelInstance } from './types';

export type GovernanceProposalAttributes = z.infer<typeof GovernanceProposal>;

export type GovernanceProposalInstance =
  ModelInstance<GovernanceProposalAttributes>;

export type GovernanceProposalModelStatic =
  Sequelize.ModelStatic<GovernanceProposalInstance>;

export default (
  sequelize: Sequelize.Sequelize,
): GovernanceProposalModelStatic =>
  <GovernanceProposalModelStatic>sequelize.define<GovernanceProposalInstance>(
    'GovernanceProposal',
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
    {
      timestamps: false,
      tableName: 'GovernanceProposals',
      underscored: true,
    },
  );
