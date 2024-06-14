import { dispose } from '@hicommonwealth/core';
import { afterAll, beforeAll, describe, test } from 'vitest';
import { seedDb } from '../../src/tester';

describe('Comment lifecycle', () => {
  beforeAll(async () => {
    await seedDb();
  });

  afterAll(async () => {
    await dispose()();
  });

  test('should show correct stack traces', async () => {});

  // TODO: Add comment tests
});
