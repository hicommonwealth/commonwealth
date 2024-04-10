import { Stats } from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import { StatsD } from 'hot-shots';

export const HotShotsStats = (): Stats => {
  const log = logger(__filename);
  let client: StatsD | undefined = new StatsD({
    globalTags: { env: process.env.NODE_ENV || 'development' },
    errorHandler: (error) => {
      log.error('Caught statsd socket error', error);
    },
  });
  return {
    name: 'HotShotStats',
    dispose: () =>
      new Promise((resolve) => {
        client &&
          client.close((error) => {
            error && log.error(error.message, error);
            resolve();
          });
        client = undefined;
      }),
    histogram: (key, value, tags) =>
      client && client.histogram(key, value, tags),
    set: (key, value) => client && client.set(key, value),
    increment: (key, tags) => client && client.increment(key, tags),
    incrementBy: (key, value, tags) =>
      client && client.increment(key, value, tags),
    decrement: (key, tags) => client && client.decrement(key, tags),
    decrementBy: (key, value, tags) =>
      client && client.decrement(key, value, tags),
    on: (key) => client && client.gauge(key, 1),
    off: (key) => client && client.gauge(key, 0),
    gauge: (key, value) => client && client.gauge(key, value),
    timing: (key, duration, tags) =>
      client && client.timing(key, duration, tags),
  };
};
