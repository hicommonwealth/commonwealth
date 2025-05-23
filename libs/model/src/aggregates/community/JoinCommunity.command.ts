import {
  CacheNamespaces,
  InvalidActor,
  InvalidInput,
  cache,
  type Command,
} from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import {
  ChainBase,
  CountAggregatorKeys,
  addressSwapper,
} from '@hicommonwealth/shared';
import { models } from '../../database';
import { authVerified } from '../../middleware/auth';
import { mustExist } from '../../middleware/guards';
import { findCompatibleAddress } from '../../utils/findBaseAddress';
import { emitEvent } from '../../utils/utils';

export const JoinCommunityErrors = {
  NotVerifiedAddressOrUser: 'Not verified address or user',
  MustJoinWithInjectiveAddress: 'Must join with Injective address',
  CannotJoinWithInjectiveAddress: 'Cannot join with an injective address',
};

export function JoinCommunity(): Command<typeof schemas.JoinCommunity> {
  return {
    ...schemas.JoinCommunity,
    auth: [authVerified()],
    secure: true,
    body: async ({ actor, payload }) => {
      const { community_id } = payload;

      const community = await models.Community.findOne({
        where: { id: community_id },
      });
      mustExist('Community', community);

      // note Substrate-specific address decoding
      const address =
        community.base === ChainBase.Substrate
          ? addressSwapper({
              address: actor.address!,
              currentPrefix: community.ss58_prefix!,
            })
          : actor.address!;

      const selectedAddress = await findCompatibleAddress(
        actor.user.id!,
        address,
        community.base,
      );

      if (!selectedAddress)
        throw new InvalidActor(
          actor,
          JoinCommunityErrors.NotVerifiedAddressOrUser,
        );

      // ----- Injective-specific address validation -----
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

      const address_id = await models.sequelize.transaction(
        async (transaction) => {
          // update membership if address already joined this community
          const found = await models.Address.scope('withPrivateData').findOne({
            where: { community_id, address: selectedAddress.address },
            transaction,
          });
          if (found) {
            // LEGACY NOTES: refer edge case 2)
            // either if the existing address is owned by someone else or this user,
            // we can just update with userId. this covers both edge case (1) & (2)
            // Address.updateWithTokenProvided
            await models.Address.update(
              {
                user_id: actor.user.id,
                last_active: new Date(),
                verified: selectedAddress.verified,
                hex: selectedAddress.hex,
              },
              { where: { id: found.id }, transaction },
            );
            return found.id!;
          }

          const created = await models.Address.create(
            {
              community_id,
              user_id: actor.user.id,
              address: selectedAddress.address,
              verified: selectedAddress.verified,
              verification_token: selectedAddress.verification_token,
              verification_token_expires:
                selectedAddress.verification_token_expires,
              wallet_id: selectedAddress.wallet_id,
              hex: selectedAddress.hex,
              last_active: new Date(),
              role: 'member',
              ghost_address: false,
              is_banned: false,
              oauth_provider: selectedAddress.oauth_provider,
              oauth_email: selectedAddress.oauth_email,
              oauth_email_verified: selectedAddress.oauth_email_verified,
              oauth_username: selectedAddress.oauth_username,
              oauth_phone_number: selectedAddress.oauth_phone_number,
            },
            { transaction },
          );

          await cache().addToSet(
            CacheNamespaces.CountAggregator,
            CountAggregatorKeys.CommunityProfileCount,
            community_id,
          );

          await emitEvent(
            models.Outbox,
            [
              {
                event_name: 'CommunityJoined',
                event_payload: {
                  community_id,
                  user_id: actor.user.id!,
                  created_at: created.created_at!,
                },
              },
            ],
            transaction,
          );

          return created.id!;
        },
      );

      return {
        community_id,
        base: community.base,
        address_id,
        address: selectedAddress.address,
        wallet_id: selectedAddress.wallet_id ?? undefined,
        ss58Prefix: community.ss58_prefix ?? undefined,
      };
    },
  };
}
