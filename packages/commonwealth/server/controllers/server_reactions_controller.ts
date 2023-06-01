import { DB } from '../models';
import BanCache from '../util/banCheckCache';
import { UserInstance } from '../models/user';
import { Op } from 'sequelize';

const Errors = {
  ReactionNotFound: 'Reaction not found',
  BanError: 'Ban error',
};

/**
 * An interface that describes the methods related to reactions
 */
interface IServerReactionsController {
  /**
   * Deletes reaction and returns nothing
   *
   * @param user - Current user
   * @param reactionId - ID of the reaction to delete
   * @throws `ReactionNotFound`, `BanError`
   * @returns Promise
   */
  deleteReaction(user: UserInstance, reactionId: number): Promise<void>;
}

/**
 * Implements methods related to reactions
 */
export class ServerReactionsController implements IServerReactionsController {
  constructor(private models: DB, private banCache: BanCache) {}

  async deleteReaction(user: UserInstance, reactionId: any) {
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
}
