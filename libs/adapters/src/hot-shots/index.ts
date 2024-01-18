import { Stats, logger } from '@hicommonwealth/core';
import { StatsD } from 'hot-shots';

export const HotShotsStats = (): Stats => {
  const log = logger().getLogger(__filename);
  const client = new StatsD({
    globalTags: { env: process.env.NODE_ENV || 'development' },
    errorHandler: (error) => {
      log.error('Caught statsd socket error', error);
    },
  });
  return {
    name: 'HotShotStats',
    dispose: () => {
      client.close((error) => log.error(error.message, error));
      return Promise.resolve();
    },
    histogram: (key, value, tags) => client.histogram(key, value, tags),
    set: (key, value) => client.set(key, value),
    increment: (key, tags) => client.increment(key, tags),
    incrementBy: (key, value, tags) => client.increment(key, value, tags),
    decrement: (key, tags) => client.decrement(key, tags),
    decrementBy: (key, value, tags) => client.decrement(key, value, tags),
    on: (key) => client.gauge(key, 1),
    off: (key) => client.gauge(key, 0),
    timing: (key, duration, tags) => client.timing(key, duration, tags),
  };
};
