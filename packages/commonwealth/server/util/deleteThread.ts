import type { DB, ThreadInstance } from '@hicommonwealth/model';

export default async function deleteThread(
  models: DB,
  thread: ThreadInstance,
): Promise<void> {
  models.Subscription.destroy({
    where: {
      thread_id: thread.id,
    },
  });

  await thread.destroy();
}
