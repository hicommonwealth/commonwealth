import { AppError } from '@hicommonwealth/adapters';
import {
  AddressInstance,
  CommunityInstance,
  UserInstance,
} from '@hicommonwealth/model';
import { Op } from 'sequelize';
import { afterDestroyReaction } from 'server/util/afterDestroyReaction';
import { ServerReactionsController } from '../server_reactions_controller';

const Errors = {
  ReactionNotFound: 'Reaction not found',
  BanError: 'Ban error',
};

export type DeleteReactionOptions = {
  user: UserInstance;
  address: AddressInstance;
  community: CommunityInstance;
  reactionId: any;
};

export type DeleteReactionResult = void;

export async function __deleteReaction(
  this: ServerReactionsController,
  { user, address, community, reactionId }: DeleteReactionOptions,
): Promise<DeleteReactionResult> {
  const userOwnedAddressIds = (await user.getAddresses())
    .filter((addr) => !!addr.verified)
    .map((addr) => addr.id);

  const reaction = await this.models.Reaction.findOne({
    where: {
      id: reactionId,
      address_id: { [Op.in]: userOwnedAddressIds },
    },
    include: [this.models.Address],
  });

  if (!reaction) {
    throw new AppError(`${Errors.ReactionNotFound}: ${reactionId}`);
  }

  // check if author is banned
  const [canInteract, banError] = await this.banCache.checkBan({
    communityId: reaction.community_id,
    address: address.address,
  });
  if (!canInteract) {
    throw new AppError(`${Errors.BanError}: ${banError}`);
  }

  await this.models.sequelize.transaction(async (transaction) => {
    await reaction.destroy({
      transaction,
    });

    await afterDestroyReaction(reaction, this.models, transaction);
  });
}
