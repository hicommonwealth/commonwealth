import { router } from '../../trpc';
import { createSubscriptionProcedure } from './procedures/createSubscriptionProcedure';

export const subscriptionRouter = router({
  Subscription: router({
    createSubscription: createSubscriptionProcedure,
  }),
});
