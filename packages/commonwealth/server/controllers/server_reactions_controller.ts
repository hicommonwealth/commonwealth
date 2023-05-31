import { DB } from 'server/models';
import BanCache from 'server/util/banCheckCache';
import { UserInstance } from '../models/user';
import { Op } from 'sequelize';

interface IServerReactionsController {
  /**
   * Deletes reaction and returns nothing
   *
   * @param user - Logged in user
   * @param reactionId - ID of the reaction to delete
   */
  deleteReaction(user: UserInstance, reactionId: number): Promise<void>;
}

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
      throw new Error(`Reaction not found: ${reactionId}`);
    }

    // check if author is banned
    const [canInteract, banError] = await this.banCache.checkBan({
      chain: reaction.chain,
      address: reaction.Address.address,
    });
    if (!canInteract) {
      throw new Error(banError);
    }

    await reaction.destroy();
  }
}
