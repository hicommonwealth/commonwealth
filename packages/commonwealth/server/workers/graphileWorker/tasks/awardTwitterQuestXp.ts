import { GraphileTask, TaskPayloads } from '@hicommonwealth/model';
import { z } from 'zod';

const awardTwitterQuestX = async (
  payload: z.infer<typeof TaskPayloads.AwardTwitterQuestXp>,
) => {};

export const awardTwitterQuestXpTask: GraphileTask<
  typeof TaskPayloads.AwardTwitterQuestXp
> = {
  input: TaskPayloads.AwardTwitterQuestXp,
  fn: awardTwitterQuestX,
};
