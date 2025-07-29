import { Stats, config, logger } from '@hicommonwealth/core';
import { ClientOptions, StatsD } from 'hot-shots';

export const HotShotsStats = (): Stats => {
  const log = logger(import.meta);
  let statsdConfig: ClientOptions | undefined;
  if (config.RAILWAY.GIT_COMMIT_SHA) {
    statsdConfig = {
      host: config.RAILWAY.DATADOG_HOST,
      port: config.RAILWAY.DATADOG_PORT,
      protocol: 'udp',
      cacheDns: true,
      udpSocketOptions: {
        type: 'udp6',
        reuseAddr: true,
        ipv6Only: true,
      },
    };
  }
  let client: StatsD | undefined = new StatsD({
    globalTags: { env: config.NODE_ENV || 'development' },
    errorHandler: (error) => {
      log.error('Caught statsd socket error', error);
    },
    ...(statsdConfig ? statsdConfig : {}),
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
    distribution: (key, value, sampleRate, tags) =>
      client && client.distribution(key, value, sampleRate, tags),
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
