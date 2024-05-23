import { EventHandler } from '@hicommonwealth/core';
import z from 'zod';

const output = z.boolean();

export const processSubscriptionPreferencesUpdated: EventHandler<
  'SubscriptionPreferencesUpdated',
  typeof output
> = async ({ payload }) => {};
