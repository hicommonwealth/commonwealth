import { DB } from 'server/models';

import { TokenBalanceCache as TokenBalanceCacheV1 } from '../../token-balance-cache/src';
import { TokenBalanceCache as TokenBalanceCacheV2 } from '../util/tokenBalanceCache/tokenBalanceCache';

import {
  DeletePollOptions,
  DeletePollResult,
  __deletePoll,
} from './server_polls_methods/delete_poll';
import {
  GetPollVotesOptions,
  GetPollVotesResult,
  __getPollVotes,
} from './server_polls_methods/get_poll_votes';
import {
  UpdatePollVoteOptions,
  UpdatePollVoteResult,
  __updatePollVote,
} from './server_polls_methods/update_poll_vote';

/**
 * Implements methods related to polls
 *
 */
export class ServerPollsController {
  constructor(
    public models: DB,
    public tokenBalanceCacheV1: TokenBalanceCacheV1,
    public tokenBalanceCacheV2: TokenBalanceCacheV2,
  ) {}

  async deletePoll(options: DeletePollOptions): Promise<DeletePollResult> {
    return __deletePoll.call(this, options);
  }

  async getPollVotes(
    options: GetPollVotesOptions,
  ): Promise<GetPollVotesResult> {
    return __getPollVotes.call(this, options);
  }

  async updatePollVote(
    options: UpdatePollVoteOptions,
  ): Promise<UpdatePollVoteResult> {
    return __updatePollVote.call(this, options);
  }
}
