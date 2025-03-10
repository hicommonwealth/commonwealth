import { GraphileTask, TaskPayloads } from '@hicommonwealth/model';
import { z } from 'zod';

// TODO: should be idempotent since more than once execution is possible

// eslint-disable-next-line @typescript-eslint/require-await
const awardTwitterQuestX = async (
  payload: z.infer<typeof TaskPayloads.AwardTwitterQuestXp>,
) => {
  await Promise.resolve();
  console.log(payload);
};

export const awardTwitterQuestXpTask: GraphileTask<
  typeof TaskPayloads.AwardTwitterQuestXp
> = {
  input: TaskPayloads.AwardTwitterQuestXp,
  fn: awardTwitterQuestX,
};
