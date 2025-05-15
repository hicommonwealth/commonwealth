export enum GatedActionEnum {
  CREATE_THREAD = 'CREATE_THREAD',
  CREATE_COMMENT = 'CREATE_COMMENT',
  CREATE_THREAD_REACTION = 'CREATE_THREAD_REACTION',
  CREATE_COMMENT_REACTION = 'CREATE_COMMENT_REACTION',
  UPDATE_POLL = 'UPDATE_POLL',
}

export const UserFriendlyActionMap = {
  [GatedActionEnum.CREATE_THREAD]: 'Create Threads',
  [GatedActionEnum.CREATE_COMMENT]: 'Create Comments',
  [GatedActionEnum.CREATE_THREAD_REACTION]: 'Upvote Threads',
  [GatedActionEnum.CREATE_COMMENT_REACTION]: 'Upvote Comments',
  [GatedActionEnum.UPDATE_POLL]: 'Vote in Polls',
} as const satisfies Record<GatedActionEnum, string>;

export type GroupGatedActionKey = keyof typeof GatedActionEnum;

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
