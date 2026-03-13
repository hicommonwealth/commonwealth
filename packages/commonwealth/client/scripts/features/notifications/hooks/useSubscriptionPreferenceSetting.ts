// eslint-disable-next-line max-len
import { useSubscriptionPreferences } from 'state/api/trpc/subscription/useSubscriptionPreferences';

export type SubscriptionPrefType =
  | 'mobile_push_notifications_enabled'
  | 'mobile_push_discussion_activity_enabled'
  | 'mobile_push_admin_alerts_enabled';

/**
 * Easy way to use an individual subscription pref.
 */
export function useSubscriptionPreferenceSetting(
  pref: SubscriptionPrefType,
): undefined | boolean {
  const subscriptionPreferences = useSubscriptionPreferences();

  if (subscriptionPreferences.data) {
    // NOTE: trpc types are mangled again for some reason. I'm not sure why
    // because useSubscriptionPreferences looks just like other hooks we've
    // been using.  I verified this typing is correct manually.  We will have
    // to look into why tRPC keeps mangling our types.
    return subscriptionPreferences.data[pref] as boolean;
  } else {
    return undefined;
  }
}
