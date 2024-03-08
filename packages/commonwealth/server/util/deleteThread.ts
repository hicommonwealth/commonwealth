import type { DB, ThreadInstance } from '@hicommonwealth/model';

export default async function deleteThread(
  models: DB,
  thread: ThreadInstance,
  transaction: Sequelize.transaction,
): Promise<void> {
  models.Subscription.destroy({
    where: {
      thread_id: thread.id,
    },
    transaction,
  });

  await thread.destroy({ transaction });
}
