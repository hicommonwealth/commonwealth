import { DB } from '../models';

export default async function deleteThread(
  models: DB,
  thread_id: number,
): Promise<void> {
  models.Subscription.destroy({
    where: {
      offchain_thread_id: thread_id,
    },
  });

  await models.Thread.destroy({
    where: {
      id: thread_id
    }
  });
}
