import { InvalidActor, InvalidInput, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { ChainBase, addressSwapper, bech32ToHex } from '@hicommonwealth/shared';
import { models } from '../database';
import { mustExist } from '../middleware/guards';
import { assertAddressOwnership, incrementProfileCount } from '../utils';
import { findBaseAddress } from '../utils/findBaseAddress';

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
      const { community_id } = payload;
      const address = actor.address!;

      const community = await models.Community.findOne({
        where: { id: community_id },
      });
      mustExist('Community', community);

      const baseAddress = await findBaseAddress(
        actor,
        community.base,
        community.type,
      );
      if (!baseAddress)
        throw new InvalidActor(
          actor,
          JoinCommunityErrors.NotVerifiedAddressOrUser,
        );

      // ----- Injective-specific address validation ----- @jnaviask
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
      // ----- Cosmos-specific address validation -----
      const encoded_address =
        community.base === ChainBase.Substrate
          ? addressSwapper({
              address,
              currentPrefix: community.ss58_prefix!,
            })
          : address;
      const hex =
        community.base === ChainBase.CosmosSDK
          ? bech32ToHex(address)
          : undefined;

      // TODO: can we remove this assertion? Seems like a migration step that was left behind
      await assertAddressOwnership(encoded_address);

      const address_id = await models.sequelize.transaction(
        async (transaction) => {
          const found = await models.Address.scope('withPrivateData').findOne({
            where: { community_id, address: encoded_address },
            transaction,
          });

          if (!found)
            await incrementProfileCount(
              community.id,
              actor.user.id!,
              transaction,
            );

          if (found) {
            // LEGACY NOTES: refer edge case 2)
            // either if the existing address is owned by someone else or this user,
            // we can just update with userId. this covers both edge case (1) & (2)
            // Address.updateWithTokenProvided
            await models.Address.update(
              {
                user_id: actor.user.id,
                last_active: new Date(),
                verified: baseAddress.verified,
                hex,
              },
              { where: { id: found.id }, transaction },
            );
            return found.id!;
          }

          const created = await models.Address.create(
            {
              user_id: actor.user.id,
              address: encoded_address, // TODO: @timolegros would this allow addresses from incompatible chains to join?
              community_id,
              hex,
              verified: baseAddress.verified,
              verification_token: baseAddress.verification_token,
              verification_token_expires:
                baseAddress.verification_token_expires,
              wallet_id: baseAddress.wallet_id,
              last_active: new Date(),
              role: 'member',
              is_user_default: false,
              ghost_address: false,
              is_banned: false,
            },
            { transaction },
          );
          return created.id!;
        },
      );

      return {
        community_id,
        base: community.base,
        base_address: baseAddress.address,
        address_id,
        encoded_address,
        wallet_id: baseAddress.wallet_id ?? undefined,
        ss58Prefix: community.ss58_prefix ?? undefined,
      };
    },
  };
}
