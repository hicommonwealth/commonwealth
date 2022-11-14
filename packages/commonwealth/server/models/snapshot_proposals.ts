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

export type SnapshotProposalModel = ModelStatic<SnapshotProposalInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): SnapshotProposalModel => {
  const Profile = <SnapshotProposalModel>sequelize.define(
    'SnapshotProposalModel',
    {
      id: { type: dataTypes.STRING, allowNull: false},
      space: { type: dataTypes.STRING, allowNull: false},
      event: { type: dataTypes.STRING, allowNull: false},
      expire: { type: dataTypes.STRING, allowNull: false},
    }
  );

  Profile.associate = (models) => {
    models.Profile.belongsTo(models.User, {
      foreignKey: 'user_id',
      targetKey: 'id',
    });
    models.Profile.hasMany(models.Address, { foreignKey: 'profile_id' });
  };

  return Profile;
};
