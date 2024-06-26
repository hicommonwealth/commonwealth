import { dispose } from '@hicommonwealth/core';
import { DB, tester } from '@hicommonwealth/model';
import { expect } from 'chai';
import sinon from 'sinon';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  test,
} from 'vitest';
import { scheduleNodeProcessing } from '../../../server/workers/evmChainEvents/nodeProcessing';
import {
  getTestAbi,
  getTestCommunityContract,
  getTestContract,
  getTestSignatures,
} from './util';

describe('scheduleNodeProcessing', () => {
  const sandbox = sinon.createSandbox();
  let processChainStub: sinon.SinonSpy;
  let clock: sinon.SinonFakeTimers;
  let singleSourceSuccess = false;
  let models: DB;

  beforeAll(async () => {
    await tester.seedDb();
    const res = await import('@hicommonwealth/model');
    models = res['models'];
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
    await getTestCommunityContract();
    const abi = await getTestAbi();
    const contract = await getTestContract();
    await contract.update({ abi_id: abi.id });
    await getTestSignatures();

    const interval = 10_000;
    await scheduleNodeProcessing(models, interval, processChainStub);

    expect(processChainStub.calledOnce).to.be.false;

    clock.tick(1);
    expect(processChainStub.calledOnce).to.be.true;
    singleSourceSuccess = true;
  });

  test('should evenly schedule 2 sources per interval', async () => {
    expect(singleSourceSuccess).to.be.true;
    await getTestCommunityContract('v2');
    const abi = await getTestAbi('v2');
    const contract = await getTestContract('v2');
    await contract.update({ abi_id: abi.id });
    await getTestSignatures('v2');

    const interval = 10_000;
    await scheduleNodeProcessing(models, interval, processChainStub);

    expect(processChainStub.calledOnce).to.be.false;
    clock.tick(1);
    expect(processChainStub.calledOnce).to.be.true;

    clock.tick(interval / 2);
    expect(processChainStub.calledTwice).to.be.true;
  });
});
