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

export function joinStringsWithSeparator(
  strings: string[],
  separatorType: ',' | '&' | ',&',
): string {
  if (strings.length === 0) return '';
  if (strings.length === 1) return strings[0];

  switch (separatorType) {
    case ',':
      return strings.join(', ');
    case '&':
      return strings.join(' & ');
    case ',&':
      const allButLast = strings.slice(0, -1);
      const last = strings[strings.length - 1];
      return `${allButLast.join(', ')} and ${last}`;
    default:
      // This should never happen due to the type constraint, but TypeScript may require it
      return strings.join(' ');
  }
}

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
  separatorType,
}: {
  actions: GatedActionEnum[];
  invert?: boolean;
  separatorType?: ',' | '&' | ',&';
}) {
  if (!invert) {
    if (!actions.length) return 'None';

    return joinStringsWithSeparator(
      actions.map((action) => UserFriendlyActionMap[action]),
      separatorType || '&',
    );
  }

  const ungatedActions = getUngatedActions(actions);
  if (!ungatedActions.length) return 'None';

  return joinStringsWithSeparator(
    ungatedActions.map((action) => UserFriendlyActionMap[action]),
    separatorType || '&',
  );
}

export type GroupGatedActionKey = keyof typeof GatedActionEnum;

export type GatedActionValue = (typeof GatedActionEnum)[GroupGatedActionKey];

export const isGatedAction = (
  value: GatedActionEnum,
): value is GatedActionEnum => {
  return Object.values(GatedActionEnum).includes(value);
};
