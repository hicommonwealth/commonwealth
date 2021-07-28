import * as Sequelize from 'sequelize';
import { BuildOptions, DataTypes, Model } from 'sequelize';
import { UserInstance, UserAttributes } from './user';

export interface SocialAccountAttributes {
  id?: number;
  provider: string;
  provider_username: string;
  provider_userid: string;
  access_token: string;
  refresh_token: string;
  created_at?: Date;
  updated_at?: Date;

  // associations
  User?: UserAttributes | UserAttributes['id'];
}

export interface SocialAccountInstance extends Model<SocialAccountAttributes>, SocialAccountAttributes {
  getUser: Sequelize.BelongsToGetAssociationMixin<UserInstance>;
  setUser: Sequelize.BelongsToSetAssociationMixin<UserInstance, UserInstance['id']>;
}

type SocialAccountModelStatic = typeof Model
    & { associate: (models: any) => void }
    & { new(values?: Record<string, unknown>, options?: BuildOptions): SocialAccountInstance }

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): SocialAccountModelStatic => {
  const SocialAccount = <SocialAccountModelStatic>sequelize.define('SocialAccount', {
    id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    provider: { type: dataTypes.STRING },
    provider_username: { type: dataTypes.STRING },
    provider_userid: { type: dataTypes.STRING },
    access_token: { type: dataTypes.STRING },
    refresh_token: { type: dataTypes.STRING },
    created_at: { type: dataTypes.DATE, allowNull: false, defaultValue: dataTypes.NOW },
    updated_at: { type: dataTypes.DATE, allowNull: false, defaultValue: dataTypes.NOW },
  }, {
    tableName: 'SocialAccounts',
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['user_id', 'provider'] },
    ],
  });

  SocialAccount.associate = (models) => {
    models.SocialAccount.belongsTo(models.User);
  };

  return SocialAccount;
};
