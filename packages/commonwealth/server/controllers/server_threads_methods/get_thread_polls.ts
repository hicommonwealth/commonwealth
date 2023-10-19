import { ServerThreadsController } from '../server_threads_controller';
import { PollAttributes } from 'server/models/poll';

export type GetThreadPollsOptions = {
  threadId: number;
};
export type GetThreadPollsResult = PollAttributes[];

export async function __getThreadPolls(
  this: ServerThreadsController,
  { threadId }: GetThreadPollsOptions
): Promise<GetThreadPollsResult> {
  const polls = await this.models.Poll.findAll({
    where: { thread_id: threadId },
    include: { model: this.models.Vote, as: 'votes' },
  });

  return polls.map((poll) => poll.toJSON());
}
