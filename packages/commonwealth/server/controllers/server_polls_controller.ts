import { DB } from '@hicommonwealth/model';

import { TokenBalanceCache } from '@hicommonwealth/model';

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
  constructor(public models: DB, public tokenBalanceCache: TokenBalanceCache) {}

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
