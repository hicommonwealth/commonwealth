import { QuestAction } from './types';

export const doesActionRequireCreatorReward = (action: QuestAction) => {
  // These are inferred from libs/model/src/user/Xp.projection.ts
  return (
    action === 'CommunityCreated' ||
    action === 'CommunityJoined' ||
    action === 'CommentUpvoted'
  );
};

export const doesActionRequireContentId = (action: QuestAction) => {
  // These are inferred from libs/model/src/user/Xp.projection.ts
  return (
    action === 'CommentCreated' ||
    action === 'CommentUpvoted' ||
    action === 'ThreadUpvoted'
  );
};
