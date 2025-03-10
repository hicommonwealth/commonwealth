import { QuestAction } from './types';

export const doesActionRequireRewardShare = (action: QuestAction) => {
  // These are inferred from libs/model/src/user/Xp.projection.ts
  return (
    action === 'CommunityCreated' ||
    action === 'CommunityJoined' ||
    action === 'CommentUpvoted'
  );
};

export const doesActionRewardShareForReferrer = (action: QuestAction) => {
  // These are inferred from libs/model/src/user/Xp.projection.ts
  return action === 'CommunityCreated' || action === 'CommunityJoined';
};

export const doesActionRewardShareForCreator = (action: QuestAction) => {
  // These are inferred from libs/model/src/user/Xp.projection.ts
  return action === 'CommentUpvoted';
};

export const doesActionAllowContentId = (action: QuestAction) => {
  // These are inferred from libs/model/src/user/Xp.projection.ts
  return (
    action === 'CommentCreated' ||
    action === 'CommentUpvoted' ||
    action === 'ThreadUpvoted'
  );
};
