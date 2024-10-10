import { dispose } from '@hicommonwealth/core';
import { ContractAbiInstance, models, tester } from '@hicommonwealth/model';
import sinon from 'sinon';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from 'vitest';
import { scheduleNodeProcessing } from '../../../server/workers/evmChainEvents/nodeProcessing';
import { createAdditionalEventSources, createEventSources } from './util';

describe('scheduleNodeProcessing', () => {
  const sandbox = sinon.createSandbox();
  let processChainStub: sinon.SinonSpy;
  let clock: sinon.SinonFakeTimers;
  let singleSourceSuccess = false;
  let namespaceAbiInstance: ContractAbiInstance;
  let stakesAbiInstance: ContractAbiInstance;

  beforeAll(async () => {
    await tester.bootstrap_testing(true);
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
  });

  test('should not schedule anything if there are no event sources', async () => {
    await scheduleNodeProcessing(models, 1000, processChainStub);
    clock.tick(1001);
    expect(processChainStub.called).to.be.false;
  });

  test('should schedule processing for a single source', async () => {
    const res = await createEventSources();
    namespaceAbiInstance = res.namespaceAbiInstance;
    stakesAbiInstance = res.stakesAbiInstance;

    const interval = 10_000;
    await scheduleNodeProcessing(models, interval, processChainStub);

    expect(processChainStub.calledOnce).to.be.false;

    clock.tick(1);
    expect(processChainStub.calledOnce).to.be.true;
    singleSourceSuccess = true;
  });

  test('should evenly schedule 2 sources per interval', async () => {
    expect(singleSourceSuccess).to.be.true;
    expect(namespaceAbiInstance).toBeTruthy();
    expect(stakesAbiInstance).toBeTruthy();

    await createAdditionalEventSources(namespaceAbiInstance, stakesAbiInstance);

    const interval = 10_000;
    await scheduleNodeProcessing(models, interval, processChainStub);

    expect(processChainStub.calledOnce).to.be.false;
    clock.tick(1);
    expect(processChainStub.calledOnce).to.be.true;

    clock.tick(interval / 2);
    expect(processChainStub.calledTwice).to.be.true;
  });
});
