import type { DB, ThreadInstance } from '@hicommonwealth/model';
import { Transaction } from 'sequelize';

export default async function deleteThread(
  models: DB,
  thread: ThreadInstance,
  transaction: Transaction,
): Promise<void> {
  models.Subscription.destroy({
    // @ts-expect-error StrictNullChecks
    where: {
      thread_id: thread.id,
    },
    transaction,
  });

  await thread.destroy({ transaction });
}
