import { logger } from '@hicommonwealth/core';
import { Address } from '@hicommonwealth/schemas';
import { WalletId } from '@hicommonwealth/shared';
import Sequelize from 'sequelize';
import { z } from 'zod';
import type { CommunityAttributes, CommunityInstance } from './community';
import { MembershipAttributes } from './membership';
import type { SsoTokenInstance } from './sso_token';
import type { ModelInstance } from './types';
import type { UserInstance } from './user';

const log = logger(import.meta);

export type AddressAttributes = z.infer<typeof Address> & {
  // associations
  Community?: CommunityAttributes;
  Memberships?: MembershipAttributes[];
};

export type AddressInstance = ModelInstance<AddressAttributes> & {
  getCommunity: Sequelize.BelongsToGetAssociationMixin<CommunityInstance>;
  getUser: Sequelize.BelongsToGetAssociationMixin<UserInstance>;
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
      ghost_address: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      wallet_id: { type: Sequelize.STRING, allowNull: true },
      block_info: { type: Sequelize.STRING, allowNull: true },
      is_banned: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
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
      oauth_provider: { type: Sequelize.STRING, allowNull: true },
      oauth_email: { type: Sequelize.STRING, allowNull: true },
      oauth_email_verified: { type: Sequelize.BOOLEAN, allowNull: true },
      oauth_username: { type: Sequelize.STRING, allowNull: true },
      oauth_phone_number: { type: Sequelize.STRING, allowNull: true },
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
      hooks: {
        beforeCreate(instance: AddressInstance) {
          if (
            instance.wallet_id === WalletId.Magic &&
            !instance.oauth_provider
          ) {
            const e = new Error('Missing oauth provider');
            log.error(`Stack trace: ${e.stack}`, e, {
              user_id: instance.user_id,
              community_id: instance.community_id,
              address: instance.address,
              stack: e.stack,
            });
          }
        },
      },
      defaultScope: {
        attributes: {
          exclude: [
            'verification_token',
            'verification_token_expires',
            'block_info',
            'created_at',
            'updated_at',
            'oauth_provider',
            'oauth_email',
            'oauth_username',
            'oauth_phone_number',
            'oauth_email_verified',
          ],
        },
      },
      scopes: {
        withPrivateData: {},
      },
    },
  );
