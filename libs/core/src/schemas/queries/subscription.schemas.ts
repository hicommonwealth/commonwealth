import { z } from 'zod';
import { CommunityAlert, SubscriptionPreference } from '../entities.schemas';

export const GetSubscriptionPreferences = {
  input: z.object({}),
  output: SubscriptionPreference,
};

export const GetCommunityAlerts = {
  input: z.object({}),
  output: CommunityAlert.array(),
};
