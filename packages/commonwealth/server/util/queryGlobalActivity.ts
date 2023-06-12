import type MinimumProfile from '../../client/scripts/models/MinimumProfile';
import type { DB } from '../models';
import { getActivityFeed } from './activityUtils';

export type GlobalActivity = Array<{
  category_id: string;
  comment_count: string;
  last_activity: string;
  notification_data: string; // actually object but stringified
  reaction_count: string;
  thread_id: string;
  view_count: number;
  commenters: MinimumProfile[];
}>;

export default async function queryGlobalActivity(
  models: DB
): Promise<GlobalActivity> {
  const notificationsWithProfiles = await getActivityFeed(models);
  // TODO: verify output type
  return notificationsWithProfiles as GlobalActivity;
}
