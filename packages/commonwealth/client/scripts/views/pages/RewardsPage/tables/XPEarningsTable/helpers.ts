import { QuestAction } from '../../../CreateQuest/QuestForm/QuestActionSubForm';
import {
  doesActionRequireRewardShare,
  doesActionRewardShareForCreator,
  doesActionRewardShareForReferrer,
} from '../../../CreateQuest/QuestForm/QuestActionSubForm/helpers';

export const getTagConfigForRewardType = ({
  action,
  auth_user_id,
  log,
}: {
  action: QuestAction;
  auth_user_id: number;
  log: { user_id: number; creator_id };
}) => {
  if (doesActionRequireRewardShare(action)) {
    if (
      doesActionRewardShareForCreator(action) &&
      auth_user_id === log.creator_id
    ) {
      return { type: 'proposal', copy: `Creator Bonus` };
    }

    if (
      doesActionRewardShareForReferrer(action) &&
      auth_user_id === log.creator_id
    ) {
      return { type: 'trending', copy: `Referrer Bonus` };
    }
  }

  return { type: 'new', copy: `Task Completion` };
};
