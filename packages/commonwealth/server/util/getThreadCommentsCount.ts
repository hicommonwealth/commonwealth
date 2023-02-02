import { Op } from 'sequelize';
import type { DB } from '../models';
import type { ThreadAttributes } from '../models/thread';

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
  const rootIds = threads.map((thread) => `${thread.kind}_${thread.id}`);

  const commentsCount = await models.Comment.count({
    attributes: ['root_id'],
    where: {
      chain: chainId,
      root_id: { [Op.in]: rootIds },
      deleted_at: null,
    },
    group: 'root_id',
  });

  return threads.map((thread) => {
    const numberOfComment = commentsCount.find(
      (el) => el.root_id === `${thread.kind}_${thread.id}`
    );

    return {
      ...thread,
      numberOfComments: numberOfComment?.count || 0,
    };
  });
};

export default getThreadsWithCommentCount;
