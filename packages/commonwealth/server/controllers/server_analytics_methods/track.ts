import { serverAnalyticsTrack } from '../../../shared/analytics/server-track';
import { AnalyticsPayload } from '../../../shared/analytics/types';

export type TrackOptions = Record<string, any> & AnalyticsPayload;

export async function __track(options: TrackOptions) {
  return serverAnalyticsTrack(options);
}
