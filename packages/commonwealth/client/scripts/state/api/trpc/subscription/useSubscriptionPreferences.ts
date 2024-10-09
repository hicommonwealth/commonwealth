import { trpc } from 'utils/trpcClient';

export function useSubscriptionPreferences() {
  const foo = trpc.subscription.getSubscriptionPreferences.useQuery({});
  return foo;
}
