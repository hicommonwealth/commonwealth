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

/**
 * An object where the keys are a gated action and the values are objects
 * where the keys are group ids and the values are group names. Generally this
 * type of object is used to store the groups that a user must join to perform
 * specific actions.
 * Example: { CREATE_THREAD: { 1: 'ETH holders' }, CREATE_COMMENT: { 5: 'Eth Whales' } }
 */
export type ActionGroups = Partial<
  Record<GatedActionEnum, Record<number, string>>
>;

/**
 * Given an object of ActionsGroup type and the relevant actions to filter by,
 * this function returns the names of groups a user must join to perform the
 * actions. It is recommended to provide a single filterAction at a time since
 * if multiple are provided, the group names will not apply to a specific action.
 * @param actionGroups An object containing the groups a user must join to perform specific actions.
 * @param filterAction The action or actions to get group names for.
 */
export function getMustJoinGroupNames(
  actionGroups: ActionGroups,
  filterAction: GatedActionEnum | GatedActionEnum[],
) {
  const fActions = Array.isArray(filterAction) ? filterAction : [filterAction];

  if (!Object.keys(actionGroups).length) return [];
  if (!fActions.length) return [];

  const mustJoinGroupNames = new Set<GatedActionEnum>([]);
  for (const action of fActions) {
    const groups = actionGroups[action];
    if (!groups) continue;
    for (const groupId in groups) {
      mustJoinGroupNames.add(groups[groupId] as GatedActionEnum);
    }
  }
  return Array.from(mustJoinGroupNames);
}

export function canUserPerformGatedAction(
  actionGroups: ActionGroups,
  action: GatedActionEnum,
) {
  const groups = actionGroups[action];
  return !groups || !Object.keys(groups).length;
}
