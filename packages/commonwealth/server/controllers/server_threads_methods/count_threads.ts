import { ServerThreadsController } from '../server_threads_controller';

export type CountThreadsOptions = {
  communityId: string;
  limit?: number;
};

export type CountThreadsResult = number;

export async function __countThreads(
  this: ServerThreadsController,
  { communityId, limit }: CountThreadsOptions,
): Promise<CountThreadsResult> {
  if (limit) {
    const result = await this.models.Thread.findAll({
      attributes: ['id'],
      where: {
        community_id: communityId,
      },
      limit,
      logging: console.log,
    });
    return result.length;
  }

  return await this.models.Thread.count({
    where: {
      community_id: communityId,
    },
  });
}
