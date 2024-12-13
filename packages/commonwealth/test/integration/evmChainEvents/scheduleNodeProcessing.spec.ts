import { dispose } from '@hicommonwealth/core';
import { ContractAbiInstance, models } from '@hicommonwealth/model';
import {
  Mock,
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import { scheduleNodeProcessing } from '../../../server/workers/evmChainEvents/nodeProcessing';
import { createAdditionalEventSources, createEventSources } from './util';

describe('scheduleNodeProcessing', () => {
  let processChainStub: Mock;
  let singleSourceSuccess = false;
  let namespaceAbiInstance: ContractAbiInstance;
  let stakesAbiInstance: ContractAbiInstance;

  afterAll(async () => {
    await dispose()();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    processChainStub = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('should not schedule anything if there are no event sources', async () => {
    await scheduleNodeProcessing(models, 1000, processChainStub);
    vi.advanceTimersByTime(1000);
    expect(processChainStub).not.toHaveBeenCalled();
  });

  test('should schedule processing for a single source', async () => {
    const res = await createEventSources();
    namespaceAbiInstance = res.namespaceAbiInstance;
    stakesAbiInstance = res.stakesAbiInstance;

    const interval = 10_000;
    await scheduleNodeProcessing(models, interval, processChainStub);

    expect(processChainStub).not.toHaveBeenCalledOnce();

    vi.advanceTimersByTime(1);
    expect(processChainStub).toHaveBeenCalledOnce();
    singleSourceSuccess = true;
  });

  test('should evenly schedule 2 sources per interval', async () => {
    expect(singleSourceSuccess).to.be.true;
    expect(namespaceAbiInstance).toBeTruthy();
    expect(stakesAbiInstance).toBeTruthy();

    await createAdditionalEventSources(namespaceAbiInstance, stakesAbiInstance);

    const interval = 10_000;
    await scheduleNodeProcessing(models, interval, processChainStub);

    expect(processChainStub).not.toHaveBeenCalledOnce();
    vi.advanceTimersByTime(1);
    expect(processChainStub).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(interval / 2);
    expect(processChainStub).toHaveBeenCalledTimes(2);
  });
});
