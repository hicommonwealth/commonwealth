import { UserInstance } from 'server/models/user';
import { ServerReactionsController } from '../server_reactions_controller';
import { Op } from 'sequelize';

const Errors = {
  ReactionNotFound: 'Reaction not found',
  BanError: 'Ban error',
};

export type DeleteReactionOptions = {
  user: UserInstance;
  reactionId: any;
};

export type DeleteReactionResult = void;

export async function __deleteReaction(
  this: ServerReactionsController,
  { user, reactionId }: DeleteReactionOptions
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
    throw new Error(`${Errors.ReactionNotFound}: ${reactionId}`);
  }

  // check if author is banned
  const [canInteract, banError] = await this.banCache.checkBan({
    chain: reaction.chain,
    address: reaction.Address.address,
  });
  if (!canInteract) {
    throw new Error(`${Errors.BanError}: ${banError}`);
  }

  await reaction.destroy();
}
