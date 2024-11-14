/* eslint-disable @typescript-eslint/no-unused-vars */
import { dispose } from '@hicommonwealth/core';
import { ContractAbiInstance, models, tester } from '@hicommonwealth/model';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { getEventSources } from '../../../server/workers/evmChainEvents/getEventSources';
import {
  createAdditionalEventSources,
  createEventSources,
  multipleEventSource,
  singleEventSource,
} from './util';

describe('getEventSources', () => {
  let namespaceAbiInstance: ContractAbiInstance;
  let stakesAbiInstance: ContractAbiInstance;

  beforeAll(async () => {
    await tester.bootstrap_testing(import.meta);
    const res = await createEventSources();
    namespaceAbiInstance = res.namespaceAbiInstance;
    stakesAbiInstance = res.stakesAbiInstance;
  });

  afterAll(async () => {
    await dispose()();
  });

  test('should return a single event source', async () => {
    const result = await getEventSources(models);
    expect(JSON.stringify(result)).to.equal(JSON.stringify(singleEventSource));
  });

  test('should return multiple event sources', async () => {
    await createAdditionalEventSources(namespaceAbiInstance, stakesAbiInstance);
    const result = await getEventSources(models);
    expect(JSON.stringify(result)).to.equal(
      JSON.stringify(multipleEventSource),
    );
  });
});
