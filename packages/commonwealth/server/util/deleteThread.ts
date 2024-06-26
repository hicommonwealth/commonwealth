import type { ThreadInstance } from '@hicommonwealth/model';
import { Transaction } from 'sequelize';

export default async function deleteThread(
  thread: ThreadInstance,
  transaction: Transaction,
): Promise<void> {
  await thread.destroy({ transaction });
}
