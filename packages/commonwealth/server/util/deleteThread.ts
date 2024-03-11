import type { DB, ThreadInstance } from '@hicommonwealth/model';
import { Transaction } from 'sequelize';

export default async function deleteThread(
  models: DB,
  thread: ThreadInstance,
  transaction: Transaction,
): Promise<void> {
  models.Subscription.destroy({
    where: {
      thread_id: thread.id,
    },
    transaction,
  });

  await thread.destroy({ transaction });
}
