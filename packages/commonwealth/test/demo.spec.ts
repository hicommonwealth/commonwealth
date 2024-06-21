import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  test,
} from 'vitest';

// vitest --config ../../vite.config.ts test/demo.spec.ts
// vitest --config ../../vite.config.ts --ui test/demo.spec.ts      -- opens Vitest UI
// vitest --config ../../vite.config.ts run test/demo.spec.ts
// vitest --config ../../vite.config.ts run --fileParallelism=false
// INIT_TEST_DB=true NODE_ENV=test vitest --config ../../vite.config.ts run --fileParallelism=false
// ----> bench
// vitest --config ../../vite.config.ts --coverage run     -- In CI coverage will be reported for every push so try to group relevant commits together in a single push
// vitest --config ../../vite.config.ts --shard=1/3 run    -- used with GitHub CI Matrix

describe('Demo', () => {
  beforeAll(() => {
    console.log('Runs before all tests');
  }, 10_000);

  afterAll(() => {
    console.log('Runs after all tests');
  }, 10_000);

  beforeEach(() => {
    console.log('Runs before each test');
  });

  afterEach(() => {
    console.log('Runs after each test');
  });

  test('Should pass', () => {
    console.log('Test passed');
  });

  // NOTE: built-in chai
  test('should test something', ({ expect }) => {
    expect(1).to.equal(1);
  });

  test.skip('should be skipped', ({ expect }) => {
    expect.fail('Should fail');
  });

  const shouldRun = false;

  test.skipIf(!shouldRun)('should be skipped', ({ expect }) => {
    expect.fail('Should fail');
  });

  test.concurrent('should run concurrently 1', () => {
    // notice I didn't extract this from argument
    expect(1).to.equal(1);
  });

  test.concurrent('should run concurrently 2', () => {
    // notice I didn't extract this from argument
    expect(1).to.equal(1);
  });

  test('should use onTestFinished callback', ({ onTestFinished }) => {
    onTestFinished(() => {
      console.log('Test finished!');
    });
  });

  test('should use onTestFailed callback', ({ onTestFailed }) => {
    onTestFailed(() => {
      console.log('Test failed');
    });

    expect(true).to.equal(false);
  });

  test.todo('should write this test');

  test.fails('fail test', () => {
    expect(true).toBe(false);
  });

  test.each([
    [1, 2, 3],
    [3, 4, 7],
  ])('addition', (a, b, expected) => {
    expect(a + b).to.equal(expected);
  });

  test('type testing', () => {
    const someFunc = () => {};
    expectTypeOf(someFunc).toBeFunction();

    const x = [10];
    expectTypeOf(x).toBeArray();
  });
});

// These tests are not yet included in any package.json test scripts - potentially enabled in follow-ups
if (import.meta.vitest) {
  // const { describe, test } = import.meta.vitest;
  describe('In-source testing', () => {
    test('example', () => {});
  });
}
