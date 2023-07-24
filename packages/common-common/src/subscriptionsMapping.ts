import { NotificationCategories, NotificationCategory } from './types';

type keyFormat = 'snake_case' | 'camelCase';

// This type is used to express that a notification category can have multiple optional keys but if an optional
// key is not present then an alternative/dependency key must be present. For example, for NewComment notifications,
// a subscription may define a threadId if the comment is at the root level of a thread, but it may instead define
// a commentId if the subscription is on a sub-comment.
export type SubscriptionKeyOptions =
  | { required: true }
  | { required: false; dependency: string };

// Allows interfaces which don't have index signatures to be passed as Generic Arguments to checkSubscriptionKey.
// This type is less strict than Record<string, unknown> which requires supporting looking up any string key on
// the object.
type LooseObject<T> = { [P in keyof T]: unknown };

/**
 * Converts a string to the desired snake_case or camelCase format. If the key is already in the correct format it
 * is returned.
 * @param format 'snake_case' or 'camelCase' strings indicating how the key should be formatted
 * @param key The string to format in snake_case or camelCase
 */
export function formatStringCase(format: keyFormat, key: string) {
  const camelCaseRegex = /^[a-z][a-zA-Z0-9]*([A-Z][a-z0-9]*)*$/;
  if (format === 'snake_case' && camelCaseRegex.test(key)) {
    return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  } else if (format === 'camelCase' && !camelCaseRegex.test(key)) {
    return key.replace(/(_\w)/g, (match) => match[1].toUpperCase());
  } else {
    return key;
  }
}

/**
 * This function returns an object that indicates which keys/values are required and optional in order to uniquely
 * identify a subscription of the given category. For example, a unique NewThread subscription must have a category id
 * and a chain id defined. The function returns the keys in either snake_case or camelCase in order to suit both client
 * format (camelCase) and database columns (snake_case).
 * @param category
 * @param format
 */
export function getUniqueSubscriptionKeys(
  category: NotificationCategory,
  format: keyFormat
): { [key: string]: SubscriptionKeyOptions } {
  const formattedCategoryId: { [key: string]: SubscriptionKeyOptions } = {
    [formatStringCase(format, 'categoryId')]: { required: true },
  };

  if (
    category === NotificationCategories.ChainEvent ||
    category === NotificationCategories.NewThread
  ) {
    return {
      ...formattedCategoryId,
      [formatStringCase(format, 'chainId')]: { required: true },
    };
  } else if (
    category === NotificationCategories.NewCollaboration ||
    category === NotificationCategories.NewMention
  ) {
    return { ...formattedCategoryId };
  } else if (
    category === NotificationCategories.NewComment ||
    category === NotificationCategories.NewReaction
  ) {
    return {
      ...formattedCategoryId,
      [formatStringCase(format, 'chainId')]: { required: true },
      [formatStringCase(format, 'threadId')]: {
        required: false,
        dependency: formatStringCase(format, 'commentId'),
      },
      [formatStringCase(format, 'commentId')]: {
        required: false,
        dependency: formatStringCase(format, 'threadId'),
      },
    };
  } else if (category === NotificationCategories.SnapshotProposal) {
    return {
      ...formattedCategoryId,
      [formatStringCase(format, 'snapshotId')]: { required: true },
    };
  }
}

/**
 * This function is used to check whether the required keys to match the given data to a subscription of the given
 * category are present. If a key is missing the given missingKeyCallback is executed and its result is returned.
 * For example, if category = 'NewThread' with format = 'snake_case' and data = { categoryId: 'NewThread' } then
 * the missingKeyCallback is executed because the data object is missing the `chainId` property which is required
 * to uniquely identify a NewThread subscription.
 * @param category The notification category (and subscription) that the data should be correctly mapped to
 * @param format The format of the keys which can be either snake_case or camelCase
 * @param data The object to check the existence of keys in.
 * @param missingKeyCallback The function to execute if a key is missing.
 */
export function checkSubscriptionKeyExistence<
  CallbackReturn,
  Data extends LooseObject<Data>
>(
  category: NotificationCategory,
  format: keyFormat,
  data: Data,
  missingKeyCallback: (
    category: NotificationCategory,
    key: string
  ) => CallbackReturn
): CallbackReturn | true {
  const uniqueKeys = getUniqueSubscriptionKeys(category, format);
  for (const [key, subOption] of Object.entries(uniqueKeys)) {
    if (
      subOption.required === false &&
      !data[key] &&
      subOption.dependency &&
      !data[subOption.dependency]
    ) {
      return missingKeyCallback(category, key);
    } else if (subOption.required && !data[key])
      return missingKeyCallback(category, key);
  }
  return true;
}

export function getUniqueSubscriptionPairs<
  CallbackReturn,
  Data extends LooseObject<Data>
>(
  category: NotificationCategory,
  format: keyFormat,
  data: Data,
  missingKeyCallback: (
    category: NotificationCategory,
    key: string
  ) => CallbackReturn
): Record<string, unknown> {
  const keysExist = checkSubscriptionKeyExistence(
    category,
    format,
    data,
    missingKeyCallback
  );
  if (keysExist !== true) {
    throw new Error(
      `Unable to retrieve unique values. Some values are missing from ${JSON.stringify(
        data
      )}`
    );
  }

  const uniqueKeys = getUniqueSubscriptionKeys(category, format);
  const pairs = {};
  for (const key of Object.keys(uniqueKeys)) pairs[key] = data[key];
  return pairs;
}
