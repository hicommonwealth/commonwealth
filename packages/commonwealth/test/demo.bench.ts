import { bench, describe } from 'vitest';

// vitest --config ../../vite.config.ts bench --watch=false test/demo.bench.ts

describe('Benchmarks', () => {
  bench(
    'normal sorting',
    () => {
      const x = [1, 5, 4, 2, 3];
      x.sort((a, b) => {
        return a - b;
      });
    },
    {
      time: 1000,
      iterations: 100,
    },
  );
});
