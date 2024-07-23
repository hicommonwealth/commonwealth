import { Address } from '@hicommonwealth/schemas';
import { WalletId } from '@hicommonwealth/shared';
import Sequelize from 'sequelize';
import { z } from 'zod';
import { decrementProfileCount } from '../utils';
import type { CommunityAttributes, CommunityInstance } from './community';
import { MembershipAttributes } from './membership';
import type { ProfileAttributes, ProfileInstance } from './profile';
import type { SsoTokenInstance } from './sso_token';
import type { ModelInstance } from './types';
import type { UserAttributes, UserInstance } from './user';

export type AddressAttributes = z.infer<typeof Address> & {
  // associations
  Community?: CommunityAttributes;
  Profile?: ProfileAttributes;
  User?: UserAttributes;
  Memberships?: MembershipAttributes[];
};

export type AddressInstance = ModelInstance<AddressAttributes> & {
  getCommunity: Sequelize.BelongsToGetAssociationMixin<CommunityInstance>;
  getUser: Sequelize.BelongsToGetAssociationMixin<UserInstance>;
  getProfile: Sequelize.BelongsToGetAssociationMixin<ProfileInstance>;
  getSsoToken: Sequelize.HasOneGetAssociationMixin<SsoTokenInstance>;
};

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<AddressInstance> =>
  sequelize.define<AddressInstance>(
    'Address',
    {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      address: { type: Sequelize.STRING, allowNull: false },
      community_id: { type: Sequelize.STRING, allowNull: false },
      role: {
        type: Sequelize.ENUM('member', 'moderator', 'admin'),
        defaultValue: 'member',
        allowNull: false,
      },
      is_user_default: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      verification_token: { type: Sequelize.STRING, allowNull: false },
      verification_token_expires: { type: Sequelize.DATE, allowNull: true },
      verified: { type: Sequelize.DATE, allowNull: true },
      last_active: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      user_id: { type: Sequelize.INTEGER, allowNull: true },
      is_councillor: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      is_validator: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      ghost_address: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      profile_id: { type: Sequelize.INTEGER, allowNull: true },
      wallet_id: { type: Sequelize.STRING, allowNull: true },
      wallet_sso_source: { type: Sequelize.STRING, allowNull: true },
      block_info: { type: Sequelize.STRING, allowNull: true },
      hex: {
        type: Sequelize.STRING(64),
        allowNull: true,
        validate: {
          isRequiredForCosmos() {
            if (
              [
                WalletId.Keplr,
                WalletId.Leap,
                WalletId.KeplrEthereum,
                WalletId.TerraStation,
                WalletId.CosmosEvmMetamask,
              ].includes(this.wallet_id as WalletId)
            ) {
              if (!this.hex) {
                throw new Error('hex is required for cosmos addresses');
              }
            }
          },
        },
      },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      tableName: 'Addresses',
      indexes: [
        { fields: ['address', 'community_id'], unique: true },
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
      hooks: {
        afterCreate: async (
          address: AddressInstance,
          options: Sequelize.CreateOptions<AddressAttributes>,
        ) => {
          await sequelize.models.Community.increment('address_count', {
            by: 1,
            where: { id: address.community_id },
            transaction: options.transaction,
          });
        },
        afterDestroy: async (
          address: AddressInstance,
          options: Sequelize.InstanceDestroyOptions,
        ) => {
          await sequelize.models.Community.decrement('address_count', {
            by: 1,
            where: { id: address.community_id },
            transaction: options.transaction,
          });

          await decrementProfileCount(
            sequelize.models,
            address.community_id!,
            address.user_id!,
            options.transaction!,
          );
        },
      },
    },
  );
