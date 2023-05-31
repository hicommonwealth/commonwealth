import { DB } from 'server/models';
import BanCache from 'server/util/banCheckCache';
import { UserInstance } from '../models/user';
import { ReactionAttributes } from 'server/models/reaction';
import { TokenBalanceCache } from '../../../token-balance-cache/src';
import RuleCache from 'server/util/rules/ruleCache';
import { ChainInstance } from 'server/models/chain';
import { AddressInstance } from 'server/models/address';
import checkRule from 'server/util/rules/checkRule';

interface IServerThreadsController {
  /**
   * Creates a reaction for a thread, returns reaction
   *
   * @param user - Logged in user
   * @param threadId - ID of the thread
   * @returns Promise that resolves to a reaction
   */
  createThreadReaction(
    chain: ChainInstance,
    authorAddress: AddressInstance,
    threadId: number
  ): Promise<ReactionAttributes>;
}

export class ServerThreadsController implements IServerThreadsController {
  constructor(
    private models: DB,
    private tokenBalanceCache: TokenBalanceCache,
    private ruleCache: RuleCache,
    private banCache: BanCache
  ) {}

  async createThreadReaction(
    chain: ChainInstance,
    authorAddress: AddressInstance,
    threadId: number
  ): Promise<ReactionAttributes> {
    const thread = await this.models.Thread.findOne({
      where: { id: threadId },
    });

    // check topic ban
    if (thread) {
      const topic = await this.models.Topic.findOne({
        include: {
          model: this.models.Thread,
          where: { id: thread.id },
          required: true,
          as: 'threads',
        },
        attributes: ['rule_id'],
      });
      if (topic?.rule_id) {
        const passesRules = await checkRule(
          this.ruleCache,
          this.models,
          topic.rule_id,
          authorAddress.address
        );
        if (!passesRules) {
          throw new Error('Rule check failed');
        }
      }
    }

    // check author ban
    if (chain) {
      const [canInteract, banError] = await this.banCache.checkBan({
        chain: chain.id,
        address: authorAddress.address,
      });
      if (!canInteract) {
        throw new Error(banError);
      }
    }
  }
}
