import { Op } from 'sequelize';
import type { ThreadAttributes } from '../models/thread';
import type { DB } from '../models';

interface GetThreadsWithCommentCount {
  threads: ThreadAttributes[];
  models: DB;
  chainId: string;
}

const getThreadsWithCommentCount = async ({
  threads,
  models,
  chainId,
}: GetThreadsWithCommentCount) => {
  const rootIds = threads.map((thread) => thread.id);

  const commentsCount = await models.Comment.count({
    attributes: ['thread_id'],
    where: {
      chain: chainId,
      thread_id: { [Op.in]: rootIds },
      deleted_at: null,
    },
    group: 'thread_id',
  });

  return threads.map((thread) => {
    const numberOfComment = commentsCount.find(
      (el) => el.thread_id === `${thread.kind}_${thread.id}`
    );

    return {
      ...thread,
      numberOfComments: numberOfComment?.count || 0,
    };
  });
};

export default getThreadsWithCommentCount;
