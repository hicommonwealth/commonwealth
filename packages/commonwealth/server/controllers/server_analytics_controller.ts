import { serverAnalyticsTrack } from '../../shared/analytics/server-track';
import { AnalyticsPayload } from '../../shared/analytics/types';

export type AnalyticsOptions = Record<string, any> & AnalyticsPayload;

/**
 * An interface that describes the methods related to analytics
 */
interface IServerAnalyticsController {
  /**
   * Emits a notification
   *
   * @param payload - Analytics payload
   * @returns Promise
   */
  track(options: AnalyticsOptions);
}

export class ServerAnalyticsController implements IServerAnalyticsController {
  async track(options: AnalyticsOptions) {
    await serverAnalyticsTrack(options);
  }
}
