import type { WalletId, WalletSsoSource } from 'common-common/src/types';
import type * as Sequelize from 'sequelize';
import type { DataTypes } from 'sequelize';
import type { ChainAttributes, ChainInstance } from './chain';
import type { ProfileAttributes, ProfileInstance } from './profile';
import { Role } from './role';
import type { SsoTokenAttributes, SsoTokenInstance } from './sso_token';
import type { ModelInstance, ModelStatic } from './types';
import type { UserAttributes, UserInstance } from './user';

export type AddressAttributes = {
  address: string;
  community_id: string;
  verification_token: string;
  role: Role;
  is_user_default: boolean;
  id?: number;
  verification_token_expires?: Date;
  verified?: Date;
  keytype?: string;
  block_info?: string;
  last_active?: Date;
  created_at?: Date;
  updated_at?: Date;
  user_id?: number;
  is_councillor?: boolean;
  is_validator?: boolean;
  ghost_address?: boolean;
  profile_id?: number;
  wallet_id?: WalletId;
  wallet_sso_source?: WalletSsoSource;
  // associations
  Community?: ChainAttributes;
  Profile?: ProfileAttributes;
  User?: UserAttributes;
  SsoToken?: SsoTokenAttributes;
};

export type AddressInstance = ModelInstance<AddressAttributes> & {
  getChain: Sequelize.BelongsToGetAssociationMixin<ChainInstance>;
  getUser: Sequelize.BelongsToGetAssociationMixin<UserInstance>;
  getProfile: Sequelize.BelongsToGetAssociationMixin<ProfileInstance>;
  getSsoToken: Sequelize.HasOneGetAssociationMixin<SsoTokenInstance>;
};

export type AddressModelStatic = ModelStatic<AddressInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): AddressModelStatic => {
  const Address: AddressModelStatic = <AddressModelStatic>sequelize.define(
    'Address',
    {
      id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      address: { type: dataTypes.STRING, allowNull: false },
      community_id: { type: dataTypes.STRING, allowNull: false },
      role: {
        type: dataTypes.ENUM('member', 'moderator', 'admin'),
        defaultValue: 'member',
        allowNull: false,
      },
      is_user_default: {
        type: dataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      verification_token: { type: dataTypes.STRING, allowNull: false },
      verification_token_expires: { type: dataTypes.DATE, allowNull: true },
      verified: { type: dataTypes.DATE, allowNull: true },
      keytype: { type: dataTypes.STRING, allowNull: true },
      last_active: { type: dataTypes.DATE, allowNull: true },
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
      user_id: { type: dataTypes.INTEGER, allowNull: true },
      is_councillor: {
        type: dataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      is_validator: {
        type: dataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      ghost_address: {
        type: dataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      profile_id: { type: dataTypes.INTEGER, allowNull: true },
      wallet_id: { type: dataTypes.STRING, allowNull: true },
      wallet_sso_source: { type: dataTypes.STRING, allowNull: true },
      block_info: { type: dataTypes.STRING, allowNull: true },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      tableName: 'Addresses',
      indexes: [
        { fields: ['address', 'community'], unique: true },
        { fields: ['user_id'] },
      ],
      defaultScope: {
        attributes: {
          exclude: [
            'verification_token',
            'verification_token_expires',
            'block_info',
            'created_at',
            'updated_at',
          ],
        },
      },
      scopes: {
        withPrivateData: {},
      },
    }
  );

  Address.associate = (models) => {
    models.Address.belongsTo(models.Chain, {
      foreignKey: 'community_id',
      targetKey: 'id',
    });
    models.Address.belongsTo(models.Profile, {
      foreignKey: 'profile_id',
      targetKey: 'id',
    });
    models.Address.belongsTo(models.User, {
      foreignKey: 'user_id',
      targetKey: 'id',
    });
    models.Address.hasOne(models.SsoToken);
    models.Address.hasMany(models.Comment, { foreignKey: 'address_id' });
    models.Address.hasMany(models.Thread, {
      foreignKey: 'address_id',
    });
    models.Address.belongsToMany(models.Thread, {
      through: models.Collaboration,
      as: 'collaboration',
    });
    models.Address.hasMany(models.Collaboration);
  };

  return Address;
};
