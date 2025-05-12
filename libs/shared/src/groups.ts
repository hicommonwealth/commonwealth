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

const userFriendlyActionMap: Record<GatedActionEnum, string> = {
  [GatedActionEnum.CREATE_THREAD]: 'Post',
  [GatedActionEnum.CREATE_COMMENT]: 'Comment',
  [GatedActionEnum.CREATE_THREAD_REACTION]: 'Upvote Threads',
  [GatedActionEnum.CREATE_COMMENT_REACTION]: 'Upvote Comments',
  [GatedActionEnum.UPDATE_POLL]: 'Vote in Polls',
};

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
  if (!actions.length) return 'None';

  if (!invert) {
    return actions.map((action) => userFriendlyActionMap[action]).join('&');
  }

  return getUngatedActions(actions)
    .map((action) => userFriendlyActionMap[action])
    .join(', ');
}

export type GroupPermissionAction = keyof typeof GatedActionEnum;
