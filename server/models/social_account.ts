import * as Sequelize from 'sequelize';
import { UserInstance } from './user';

export interface SocialAccountAttributes {
  id?: number;
  provider: string;
  provider_username: string;
  provider_userid: string;
  access_token: string;
  refresh_token: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface SocialAccountInstance extends Sequelize.Instance<SocialAccountAttributes>, SocialAccountAttributes {
  getUser: Sequelize.BelongsToGetAssociationMixin<UserInstance>;
  setUser: Sequelize.BelongsToSetAssociationMixin<UserInstance, UserInstance['id']>;
}

export type SocialAccountModel = Sequelize.Model<SocialAccountInstance, SocialAccountAttributes>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): SocialAccountModel => {
  const SocialAccount = sequelize.define<SocialAccountInstance, SocialAccountAttributes>('SocialAccount', {
    id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    provider: { type: dataTypes.STRING },
    provider_username: { type: dataTypes.STRING },
    provider_userid: { type: dataTypes.STRING },
    access_token: { type: dataTypes.STRING },
    refresh_token: { type: dataTypes.STRING },
    created_at: { type: dataTypes.DATE, allowNull: false },
    updated_at: { type: dataTypes.DATE, allowNull: false },
  }, {
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
