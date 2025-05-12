export enum GatedActionEnum {
  CREATE_THREAD = 'CREATE_THREAD',
  CREATE_COMMENT = 'CREATE_COMMENT',
  CREATE_THREAD_REACTION = 'CREATE_THREAD_REACTION',
  CREATE_COMMENT_REACTION = 'CREATE_COMMENT_REACTION',
  UPDATE_POLL = 'UPDATE_POLL',
}

const AllGatedActionSet = new Set(Object.values(GatedActionEnum));

export function getUngatedActions(gatedActions: GatedActionEnum[]) {
  if (!gatedActions.length) return Array.from(AllGatedActionSet);
  const gatedActionsSet = new Set(gatedActions);
  return Array.from(AllGatedActionSet.difference(gatedActionsSet));
}

export const UserFriendlyActionMap = {
  [GatedActionEnum.CREATE_THREAD]: 'Create Threads',
  [GatedActionEnum.CREATE_COMMENT]: 'Create Comments',
  [GatedActionEnum.CREATE_THREAD_REACTION]: 'Upvote Threads',
  [GatedActionEnum.CREATE_COMMENT_REACTION]: 'Upvote Comments',
  [GatedActionEnum.UPDATE_POLL]: 'Vote in Polls',
} as const satisfies Record<GatedActionEnum, string>;

/**
 * Converts a gating actions array into a user-friendly string. Pass `invert: true`
 * to get the user-friendly string from the set difference between AllGatedActionSet
 * and the given actions i.e. AllGatedActionSet - actions.
 * Example:
 *  input = { actions: ['CREATE_THREAD'], invert: true }
 *  output = 'Comment, Upvote Threads, Upvote Comments, Vote in Polls'
 *
 *  input = { actions: ['CREATE_THREAD'], invert: false }
 *  output = 'Post'
 */
export function getReadableActions({
  actions,
  invert,
}: {
  actions: GatedActionEnum[];
  invert?: boolean;
}) {
  if (!invert) {
    if (!actions.length) return 'None';

    return actions.map((action) => UserFriendlyActionMap[action]).join(' & ');
  }

  const ungatedActions = getUngatedActions(actions);
  if (!ungatedActions.length) return 'None';

  return ungatedActions
    .map((action) => UserFriendlyActionMap[action])
    .join(' & ');
}

export type GroupGatedActionKey = keyof typeof GatedActionEnum;

export type GatedActionValue = (typeof GatedActionEnum)[GroupGatedActionKey];
