/**
 * Return a boolean indicating if we're active, and a callback to toggle
 * the activation.
 */
type UseSubscriptionPreferenceSettingCallbackResult = Readonly<
  [boolean, () => void]
>;
//
// type SubscriptionPreferenceType = typeof SubscriptionPreference;
// type PushNotificationType = Pick<
//   SubscriptionPreferenceType,
//   | 'mobile_push_notifications_enabled'
//   | 'mobile_push_discussion_activity_enabled'
//   | 'mobile_push_admin_alerts_enabled'
// >;

// export function useSubscriptionPreferenceSettingCallback(
//   pref: keyof PushNotificationType,
// ): UseSubscriptionPreferenceSettingCallbackResult {
//   const subscriptionPreferences = useSubscriptionPreferences();
//
//   const toggle = () => {
//     console.log('FIXME toggle');
//   };
//
//   return subscriptionPreferences.data ? [subscriptionPreferences.data[pref] : false, toggle];
// }
