import type * as Sequelize from 'sequelize';
import type { DataTypes } from 'sequelize';
import type { ModelInstance, ModelStatic } from './types';

export type SnapshotProposalAttributes = {
  id: string;
  title?: string;
  body?: string;
  choices?: string[];
  space: string;
  event: string;
  start?: string;
  expire: string;
  is_upstream_deleted?: boolean;
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
        type: dataTypes.STRING,
        allowNull: false,
        primaryKey: true,
      },
      title: {
        type: dataTypes.STRING,
        allowNull: true,
      },
      body: {
        type: dataTypes.TEXT,
        allowNull: true,
      },
      choices: {
        type: dataTypes.ARRAY(dataTypes.STRING),
        allowNull: true,
      },
      space: {
        type: dataTypes.STRING,
        allowNull: false,
      },
      event: {
        type: dataTypes.STRING,
        allowNull: true,
      },
      start: {
        type: dataTypes.STRING,
        allowNull: true,
      },
      expire: {
        type: dataTypes.STRING,
        allowNull: true,
      },
      is_upstream_deleted: {
        type: dataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAt: { type: dataTypes.DATE, allowNull: false },
      updatedAt: { type: dataTypes.DATE, allowNull: false },
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
