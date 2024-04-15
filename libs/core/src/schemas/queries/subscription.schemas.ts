import { z } from 'zod';
import { SubscriptionPreference } from '../entities.schemas';

export const GetSubscriptionPreferences = {
  input: z.object({}),
  output: SubscriptionPreference,
};
