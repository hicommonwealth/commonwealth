import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ModelStatic, ModelInstance } from './types';

export type SnapshotProposalAttributes = {
  id: string;
  space: string;
  event: string;
  expire: string;
};

export type SnapshotProposalInstance = ModelInstance<
  SnapshotProposalAttributes
> & {
  getSnapshotProposal: Sequelize.BelongsToGetAssociationMixin<
    SnapshotProposalInstance
  >;
};

export type SnapshotProposalModelStatic = ModelStatic<SnapshotProposalInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): SnapshotProposalModelStatic => {
  const SnapshotProposal = <SnapshotProposalModelStatic>sequelize.define(
    'SnapshotProposal',
    {
      id: { type: dataTypes.STRING, allowNull: false, primaryKey: true },
      space: { type: dataTypes.STRING, allowNull: false},
      event: { type: dataTypes.STRING, allowNull: true},
      expire: { type: dataTypes.STRING, allowNull: false},
    }
  );

  return SnapshotProposal;
};
