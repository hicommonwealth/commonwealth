import { QuestAction } from './types';

export const doesActionRequireCreatorReward = (action: QuestAction) => {
  // These are inferred from libs/model/src/user/Xp.projection.ts
  return (
    action === 'CommunityCreated' ||
    action === 'CommunityJoined' ||
    action === 'CommentUpvoted'
  );
};
