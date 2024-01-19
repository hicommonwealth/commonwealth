import { VoteAttributes } from '@hicommonwealth/model';
import { ServerThreadsController } from '../server_threads_controller';

export type GetPollVotesOptions = {
  pollId: number;
};

export type GetPollVotesResult = VoteAttributes[];

export async function __getPollVotes(
  this: ServerThreadsController,
  { pollId }: GetPollVotesOptions,
): Promise<GetPollVotesResult> {
  const votes = await this.models.Vote.findAll({
    where: {
      poll_id: pollId,
    },
  });
  return votes.map((v) => v.toJSON());
}
