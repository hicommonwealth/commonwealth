import { dispose } from '@hicommonwealth/core';
import { tester } from '@hicommonwealth/model';
import sinon from 'sinon';
import {
  MockInstance,
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import { scheduleNodeProcessing } from '../../../server/workers/evmChainEvents/nodeProcessing';
import { multipleEventSource, singleEventSource } from './util';

vi.mock('../../../server/workers/evmChainEvents/getEventSources');

describe('scheduleNodeProcessing', () => {
  const sandbox = sinon.createSandbox();
  let processChainStub: sinon.SinonSpy;
  let clock: sinon.SinonFakeTimers;
  let singleSourceSuccess = false;

  beforeAll(async () => {
    await tester.bootstrap_testing(import.meta);
  });

  afterAll(async () => {
    await dispose()();
  });

  beforeEach(() => {
    processChainStub = sandbox.stub();
    clock = sandbox.useFakeTimers();
  });

  afterEach(() => {
    sandbox.restore();
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
    clock.tick(1001);
    expect(processChainStub.called).to.be.false;
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

    expect(processChainStub.calledOnce).to.be.false;

    clock.tick(1);
    expect(processChainStub.calledOnce).to.be.true;
    singleSourceSuccess = true;
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

    expect(processChainStub.calledOnce).to.be.false;
    clock.tick(1);
    expect(processChainStub.calledOnce).to.be.true;

    clock.tick(interval / 2);
    expect(processChainStub.calledTwice).to.be.true;
  });
});
