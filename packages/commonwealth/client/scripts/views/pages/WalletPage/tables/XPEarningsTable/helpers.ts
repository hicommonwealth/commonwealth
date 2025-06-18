import { XpLogView } from '@hicommonwealth/schemas';
import { z } from 'zod';

export const getTagConfigForRewardType = (log: z.infer<typeof XpLogView>) => {
  if (log.is_creator && log.user_id !== log.creator_user_id) {
    return log.is_referral
      ? { type: 'trending', copy: `Referrer Bonus` }
      : { type: 'proposal', copy: `Creator Bonus` };
  }
  return { type: 'new', copy: `Task Completion` };
};
