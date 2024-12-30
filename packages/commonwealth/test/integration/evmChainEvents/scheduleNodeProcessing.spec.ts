import { dispose } from '@hicommonwealth/core';
import {
  Mock,
  MockInstance,
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import { scheduleNodeProcessing } from '../../../server/workers/evmChainEvents/nodeProcessing';
import { multipleEventSource, singleEventSource } from '../../util/util';

vi.mock('../../../server/workers/evmChainEvents/getEventSources');

describe('scheduleNodeProcessing', () => {
  let processChainStub: Mock;

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
    vi.resetAllMocks();
  });

  test('should not schedule anything if there are no event sources', async () => {
    const { getEventSources } = await import(
      '../../../server/workers/evmChainEvents/getEventSources'
    );
    (getEventSources as unknown as MockInstance).mockImplementation(() =>
      Promise.resolve({}),
    );

    await scheduleNodeProcessing(1000, processChainStub);
    vi.advanceTimersByTime(1000);
    expect(processChainStub).not.toHaveBeenCalled();
  });

  test('should schedule processing for a single source', async () => {
    // const res = await createContestEventSources();
    const { getEventSources } = await import(
      '../../../server/workers/evmChainEvents/getEventSources'
    );
    (getEventSources as unknown as MockInstance).mockImplementation(() =>
      Promise.resolve(singleEventSource),
    );

    const interval = 10_000;
    await scheduleNodeProcessing(interval, processChainStub);

    expect(processChainStub).not.toHaveBeenCalledOnce();

    vi.advanceTimersByTime(1);
    expect(processChainStub).toHaveBeenCalledOnce();
  });

  test('should evenly schedule 2 sources per interval', async () => {
    const { getEventSources } = await import(
      '../../../server/workers/evmChainEvents/getEventSources'
    );
    (getEventSources as unknown as MockInstance).mockImplementation(() =>
      Promise.resolve(multipleEventSource),
    );

    const interval = 10_000;
    await scheduleNodeProcessing(interval, processChainStub);

    expect(processChainStub).not.toHaveBeenCalledOnce();
    vi.advanceTimersByTime(1);
    expect(processChainStub).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(interval / 2);
    expect(processChainStub).toHaveBeenCalledTimes(2);
  });
});
