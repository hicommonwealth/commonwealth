import { TrackOptions, __track } from './server_analytics_methods/track';

export class ServerAnalyticsController {
  async track(options: TrackOptions) {
    return __track.call(this, options);
  }
}
