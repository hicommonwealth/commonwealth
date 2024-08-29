import { RoutingKey } from './interfaces';

export const successfulInMemoryBroker = {
  name: 'successful-in-memory-broker',
  dispose: () => Promise.resolve(),
  publish: () => Promise.resolve(true),
  subscribe: () => Promise.resolve(true),
  isHealthy: () => Promise.resolve(true),
  getRoutingKey: (): RoutingKey => 'ThreadCreated',
};

export const failingInMemoryBroker = {
  name: 'failing-in-memory-broker',
  dispose: () => Promise.resolve(),
  publish: () => Promise.resolve(false),
  subscribe: () => Promise.resolve(false),
  isHealthy: () => Promise.resolve(false),
};
