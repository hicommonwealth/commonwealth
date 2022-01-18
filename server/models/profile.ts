import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';

import { UserAttributes } from './user';
import { AddressAttributes } from './address';
import { ModelStatic } from './types';

export interface ProfileAttributes {
  id: number;
  user_id: number;
  created_at?: Date;
  updated_at?: Date;
  profile_name?: string;
  email?: string;
  website?: string;
  bio?: string;
  is_default?: boolean;

  // associations
  User?: UserAttributes;
}

export interface ProfileInstance
extends Model<ProfileAttributes>, ProfileAttributes {}

export type ProfileModelStatic = ModelStatic<ProfileInstance>

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): ProfileModelStatic => {
  const Profile = <ProfileModelStatic>sequelize.define(
    'Profile', {
      id: { type: dataTypes.INTEGER, allowNull: false, primaryKey: true },
      user_id: { type: dataTypes.INTEGER, allowNull: false },
      created_at: { type: dataTypes.DATE, allowNull: true },
      updated_at: { type: dataTypes.DATE, allowNull: true },
      profile_name: { type: dataTypes.TEXT, allowNull: true },
      email: { type: dataTypes.TEXT, allowNull: true },
      website: { type: dataTypes.TEXT, allowNull: true },
      bio: { type: dataTypes.TEXT, allowNull: true },
      is_default: { type: dataTypes.BOOLEAN, allowNull: false },
    }, {
      tableName: 'Profiles',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['user_id'] },
      ],
    }
  );

  Profile.associate = (models) => {
    models.Profile.belongsTo(models.User, { foreignKey: 'user_id', targetKey: 'id' });
    models.Profile.hasMany(models.Address, { foreignKey: 'profile_id' });
  };

  return Profile;
};
