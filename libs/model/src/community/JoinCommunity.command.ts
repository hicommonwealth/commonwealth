import { InvalidActor, InvalidInput, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { ChainBase, addressSwapper } from '@hicommonwealth/shared';
import { models } from '../database';
import { mustExist } from '../middleware/guards';
import { findCompatibleAddress } from '../utils/findBaseAddress';
import { emitEvent } from '../utils/utils';

export const JoinCommunityErrors = {
  NotVerifiedAddressOrUser: 'Not verified address or user',
  MustJoinWithInjectiveAddress: 'Must join with Injective address',
  CannotJoinWithInjectiveAddress: 'Cannot join with an injective address',
};

export function JoinCommunity(): Command<typeof schemas.JoinCommunity> {
  return {
    ...schemas.JoinCommunity,
    auth: [],
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
              is_user_default: false,
              ghost_address: false,
              is_banned: false,
              referred_by_address: payload.referrer_address,
            },
            { transaction },
          );

          await models.Community.increment('profile_count', {
            by: 1,
            where: { id: community_id },
            transaction,
          });

          await emitEvent(models.Outbox, [
            {
              event_name: schemas.EventNames.CommunityJoined,
              event_payload: {
                community_id,
                user_id: actor.user.id!,
                referrer_address: payload.referrer_address,
                created_at: created.created_at!,
              },
            },
          ]);

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
