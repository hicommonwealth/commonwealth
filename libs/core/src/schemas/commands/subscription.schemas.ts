import { z } from 'zod';
import { SubscriptionPreference } from '../entities.schemas';

export const UpdateSubscriptionPreferences = {
  input: z
    .object({
      email_notifications_enabled: z.boolean().optional(),
      digest_email_enabled: z.boolean().optional(),
      recap_email_enabled: z.boolean().optional(),
      mobile_push_notifications_enabled: z.boolean().optional(),
      mobile_push_discussion_activity_enabled: z.boolean().optional(),
      mobile_push_admin_alerts_enabled: z.boolean().optional(),
    })
    .refine((data) => {
      return Object.values(data).some((value) => value !== undefined);
    }),
  output: SubscriptionPreference,
};
