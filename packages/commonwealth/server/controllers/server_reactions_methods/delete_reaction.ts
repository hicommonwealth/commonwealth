import { AppError } from '@hicommonwealth/core';
import {
  AddressInstance,
  CommunityInstance,
  UserInstance,
} from '@hicommonwealth/model';
import { Op } from 'sequelize';
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
  { user, address, reactionId }: DeleteReactionOptions,
): Promise<DeleteReactionResult> {
  const userOwnedAddressIds = (await user.getAddresses())
    .filter((addr) => !!addr.verified)
    .map((addr) => addr.id);

  const reaction = await this.models.Reaction.findOne({
    // @ts-expect-error StrictNullChecks
    where: {
      id: reactionId,
      address_id: { [Op.in]: userOwnedAddressIds },
    },
    include: [this.models.Address],
  });

  if (!reaction) {
    throw new AppError(`${Errors.ReactionNotFound}: ${reactionId}`);
  }

  if (address.is_banned) throw new AppError('Banned User');

  await reaction.destroy();
}
