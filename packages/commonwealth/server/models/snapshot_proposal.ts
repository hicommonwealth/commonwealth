import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ModelStatic, ModelInstance } from './types';

export type SnapshotProposalAttributes = {
  id: string;
  title?: string;
  body?: string;
  choices?: string[];
  space: string;
  event: string;
  start?: string;
  expire: string;
};

export type SnapshotProposalInstance =
  ModelInstance<SnapshotProposalAttributes> & {
    getSnapshotProposal: Sequelize.BelongsToGetAssociationMixin<SnapshotProposalInstance>;
  };

export type SnapshotProposalModelStatic = ModelStatic<SnapshotProposalInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): SnapshotProposalModelStatic => {
  const SnapshotProposal = <SnapshotProposalModelStatic>sequelize.define(
    'SnapshotProposal',
    {
      id: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      body: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      choices: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
      },
      space: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      event: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      start: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      expire: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    }
  );

  SnapshotProposal.associate = (models) => {
    models.SnapshotProposal.belongsTo(models.SnapshotSpace, {
      foreignKey: 'space',
      targetKey: 'snapshot_space',
    });
  };

  return SnapshotProposal;
};
