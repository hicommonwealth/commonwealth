import * as Sequelize from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import { ModelStatic } from './types';
import { AddressInstance, AddressAttributes } from './address';
import { ChainAttributes } from './chain';
import { ChainNodeInstance, ChainNodeAttributes } from './chain_node';
import { SocialAccountInstance, SocialAccountAttributes } from './social_account';

export type EmailNotificationInterval = 'daily' | 'never';

export interface UserAttributes {
  email: string;
  id?: number;
  emailVerified?: boolean;
  isAdmin?: boolean;
  lastVisited?: string;
  disableRichText?: boolean;
  emailNotificationInterval?: EmailNotificationInterval;
  magicIssuer?: string;
  lastMagicLoginAt?: number;
  created_at?: Date;
  updated_at?: Date;

  // associations (see https://vivacitylabs.com/setup-typescript-sequelize/)
  selectedNode?: ChainNodeAttributes | ChainNodeAttributes['id'];
  Addresses?: AddressAttributes[] | AddressAttributes['id'][];
  SocialAccounts?: SocialAccountAttributes[] | SocialAccountAttributes['id'][];
  Chains?: ChainAttributes[] | ChainAttributes['id'][];
}

export interface UserInstance extends Model<UserAttributes>, UserAttributes {
  getSelectedNode: Sequelize.BelongsToGetAssociationMixin<ChainNodeInstance>;
  setSelectedNode: Sequelize.BelongsToSetAssociationMixin<ChainNodeInstance, ChainNodeInstance['id']>;

  hasAddresses: Sequelize.HasManyHasAssociationsMixin<AddressInstance, AddressInstance['id']>;
  getAddresses: Sequelize.HasManyGetAssociationsMixin<AddressInstance>;
  setAddresses: Sequelize.HasManySetAssociationsMixin<AddressInstance, AddressInstance['id']>;

  getSocialAccounts: Sequelize.HasManyGetAssociationsMixin<SocialAccountInstance>;
  setSocialAccounts: Sequelize.HasManySetAssociationsMixin<SocialAccountInstance, SocialAccountInstance['id']>;
}

export default (
  sequelize: Sequelize.Sequelize,
): ModelStatic<UserAttributes, UserInstance> => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    email: { type: DataTypes.STRING },
    emailVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    emailNotificationInterval: {
      type: DataTypes.ENUM,
      values: ['daily', 'never'],
      defaultValue: 'never',
      allowNull: false,
    },
    isAdmin: { type: DataTypes.BOOLEAN, defaultValue: false },
    lastVisited: { type: DataTypes.TEXT, allowNull: false, defaultValue: '{}' },
    disableRichText: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
    magicIssuer: { type: DataTypes.STRING, allowNull: true },
    lastMagicLoginAt: { type: DataTypes.INTEGER, allowNull: true },
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    tableName: 'Users',
    underscored: false,
    indexes: [
      { fields: ['email'], unique: true },
    ],
    defaultScope: {
      attributes: {
        exclude: [
          'email', 'emailVerified', 'emailNotificationInterval', 'isAdmin',
          'magicIssuer', 'lastMagicLoginAt', 'created_at', 'updated_at'
        ],
      }
    },
    scopes: {
      withPrivateData: {}
    }
  }) as ModelStatic<UserAttributes, UserInstance>;

  User.associate = (models) => {
    User.belongsTo(models.ChainNode, { as: 'selectedNode', constraints: false });
    User.hasMany(models.Address);
    User.hasMany(models.SocialAccount);
    User.hasMany(models.StarredCommunity);
    User.belongsToMany(models.Chain, { through: models.WaitlistRegistration });
  };

  return User;
};
