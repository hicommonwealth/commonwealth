import * as Sequelize from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import { ModelStatic, ModelInstance } from './types';
import { UserInstance, UserAttributes } from './user';

export type SocialAccountAttributes = {
  provider: string;
  provider_username: string;
  provider_userid: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  id?: number;
  created_at?: Date;
  updated_at?: Date;

  // associations
  User?: UserAttributes | UserAttributes['id'];
};

export type SocialAccountInstance = ModelInstance<SocialAccountAttributes> & {
  getUser: Sequelize.BelongsToGetAssociationMixin<UserInstance>;
  setUser: Sequelize.BelongsToSetAssociationMixin<
    UserInstance,
    UserInstance['id']
  >;
};

export type SocialAccountModelStatic = ModelStatic<SocialAccountInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): SocialAccountModelStatic => {
  const SocialAccount = <SocialAccountModelStatic>sequelize.define(
    'SocialAccount',
    {
      id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      provider: { type: dataTypes.STRING },
      provider_username: { type: dataTypes.STRING },
      provider_userid: { type: dataTypes.STRING },
      user_id: { type: dataTypes.STRING },
      access_token: { type: dataTypes.STRING },
      refresh_token: { type: dataTypes.STRING },
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      tableName: 'SocialAccounts',
      underscored: true,
      indexes: [{ fields: ['user_id'] }, { fields: ['user_id', 'provider'] }],
    }
  );

  SocialAccount.associate = (models) => {
    models.SocialAccount.belongsTo(models.User);
  };

  return SocialAccount;
};
