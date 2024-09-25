import { InvalidActor, InvalidInput, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { ChainBase, addressSwapper, bech32ToHex } from '@hicommonwealth/shared';
import crypto from 'crypto';
import { Op } from 'sequelize';
import { config } from '../config';
import { models } from '../database';
import { mustExist } from '../middleware/guards';
import { assertAddressOwnership, incrementProfileCount } from '../utils';

export const JoinCommunityErrors = {
  NotVerifiedAddressOrUser: 'Not verified address or user',
  MustJoinWithInjectiveAddress: 'Must join with Injective address',
  CannotJoinWithInjectiveAddress: 'Cannot join with an injective address',
};

export function JoinCommunity(): Command<typeof schemas.JoinCommunity> {
  return {
    ...schemas.JoinCommunity,
    auth: [],
    body: async ({ actor, payload }) => {
      // TODO: should we pass address as input when already in header/auth context?
      const { community_id, address } = payload;

      // TODO: @timolegros is this still needed?
      const isInjectiveAddress = address.slice(0, 3) === 'inj';
      if (community_id === 'injective') {
        if (!isInjectiveAddress)
          throw new InvalidInput(
            JoinCommunityErrors.MustJoinWithInjectiveAddress,
          );
      } else if (isInjectiveAddress)
        throw new InvalidInput(
          JoinCommunityErrors.CannotJoinWithInjectiveAddress,
        );

      const community = await models.Community.findOne({
        where: { id: community_id },
      });
      mustExist('Community', community);

      // TODO: @timolegros is this still needed? Address should be authenticated already
      // check if the original address is verified and owned by the user
      const originalAddress = await models.Address.scope(
        'withPrivateData',
      ).findOne({
        where: {
          address,
          user_id: actor.user.id,
          verified: { [Op.ne]: null },
        },
      });
      if (!originalAddress)
        throw new InvalidActor(
          actor,
          JoinCommunityErrors.NotVerifiedAddressOrUser,
        );

      // TODO: @timolegros is this still needed? Address should be authenticated already
      // check if the original address's token is expired. refer edge case 1)
      let verification_token = originalAddress.verification_token;
      let verification_token_expires =
        originalAddress.verification_token_expires;
      const isOriginalTokenValid =
        verification_token_expires &&
        +verification_token_expires <= +new Date();
      if (!isOriginalTokenValid) {
        const communities = await models.Community.findAll({
          where: { base: community.base },
        });
        verification_token = crypto.randomBytes(18).toString('hex');
        verification_token_expires = new Date(
          +new Date() + config.AUTH.ADDRESS_TOKEN_EXPIRES_IN * 60 * 1000,
        );
        await models.Address.update(
          {
            verification_token,
            verification_token_expires,
          },
          {
            where: {
              user_id: actor.user.id,
              address,
              community_id: { [Op.in]: communities.map((ch) => ch.id) },
            },
          },
        );
      }

      const encoded_address =
        community.base === ChainBase.Substrate
          ? addressSwapper({
              address,
              currentPrefix: community.ss58_prefix!,
            })
          : address;
      const hex =
        community.base === ChainBase.CosmosSDK
          ? await bech32ToHex(address)
          : undefined;

      const _address = await models.sequelize.transaction(
        async (transaction) => {
          const found = await models.Address.scope('withPrivateData').findOne({
            where: { community_id, address: encoded_address },
            transaction,
          });

          if (!found || !found.verified)
            await incrementProfileCount(
              community.id,
              actor.user.id!,
              transaction,
            );

          if (found) {
            // refer edge case 2)
            // either if the existing address is owned by someone else or this user,
            // we can just update with userId. this covers both edge case (1) & (2)
            // Address.updateWithTokenProvided
            await models.Address.update(
              {
                user_id: actor.user.id,
                verification_token,
                verification_token_expires,
                last_active: new Date(),
                verified: originalAddress.verified,
                hex,
              },
              { where: { id: found.id }, transaction, returning: true },
            );
            return found;
          }

          return await models.Address.create(
            {
              user_id: actor.user.id,
              address: encoded_address,
              community_id,
              hex,
              verification_token,
              verification_token_expires,
              verified: originalAddress.verified,
              wallet_id: originalAddress.wallet_id,
              last_active: new Date(),
              role: 'member',
              is_user_default: false,
              ghost_address: false,
              is_banned: false,
            },
            { transaction },
          );
        },
      );

      // @timolegros why is this asseertion after the transaction?
      await assertAddressOwnership(encoded_address);

      const addresses = await models.Address.findAll({
        where: { user_id: actor.user.id },
        include: {
          model: models.Community,
          attributes: ['id', 'base', 'ss58_prefix'],
        },
      });
      return {
        community_id,
        address_id: _address.id!,
        encoded_address,
        verification_token: verification_token!,
        addresses: addresses.map((a) => ({
          id: a.id!,
          address: a.address,
          wallet_id: a.wallet_id,
          community_id: a.community_id,
          base: a.Community!.base!,
          ss58Prefix: a.Community!.ss58_prefix,
        })),
      };
    },
  };
}
