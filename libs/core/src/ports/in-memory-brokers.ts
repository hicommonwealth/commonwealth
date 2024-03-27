export const successfulInMemoryBroker = {
  name: 'successful-in-memory-broker',
  dispose: () => Promise.resolve(),
  publish: () => Promise.resolve(true),
  subscribe: () => Promise.resolve(true),
  isHealthy: () => Promise.resolve(true),
};

export const failingInMemoryBroker = {
  name: 'failing-in-memory-broker',
  dispose: () => Promise.resolve(),
  publish: () => Promise.resolve(false),
  subscribe: () => Promise.resolve(false),
  isHealthy: () => Promise.resolve(false),
};
