import { dispose } from '@hicommonwealth/core';
import { tester } from '@hicommonwealth/model';
import { expect } from 'chai';
import sinon from 'sinon';
import { scheduleNodeProcessing } from '../../../server/workers/evmChainEvents/nodeProcessing';
import {
  getTestAbi,
  getTestCommunityContract,
  getTestContract,
  getTestSignatures,
  getTestSubscription,
} from './util';

describe('scheduleNodeProcessing', () => {
  const sandbox = sinon.createSandbox();
  let processChainStub: sinon.SinonSpy;
  let clock: sinon.SinonFakeTimers;
  let singleSourceSuccess = false;

  before(async () => {
    await tester.seedDb();
  });

  after(async () => {
    await dispose()();
  });

  beforeEach(() => {
    processChainStub = sandbox.stub();
    clock = sandbox.useFakeTimers();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should not schedule anything if there are no event sources', async () => {
    await scheduleNodeProcessing(1000, processChainStub);
    clock.tick(1001);
    expect(processChainStub.called).to.be.false;
  });

  it('should schedule processing for a single source', async () => {
    await getTestCommunityContract();
    await getTestSubscription();
    const abi = await getTestAbi();
    const contract = await getTestContract();
    await contract.update({ abi_id: abi.id });
    await getTestSignatures();

    const interval = 10_000;
    await scheduleNodeProcessing(interval, processChainStub);

    expect(processChainStub.calledOnce).to.be.false;

    clock.tick(1);
    expect(processChainStub.calledOnce).to.be.true;
    singleSourceSuccess = true;
  });

  it('should evenly schedule 2 sources per interval', async () => {
    expect(singleSourceSuccess).to.be.true;
    await getTestCommunityContract('v2');
    await getTestSubscription('v2');
    const abi = await getTestAbi('v2');
    const contract = await getTestContract('v2');
    await contract.update({ abi_id: abi.id });
    await getTestSignatures('v2');

    const interval = 10_000;
    await scheduleNodeProcessing(interval, processChainStub);

    expect(processChainStub.calledOnce).to.be.false;
    clock.tick(1);
    expect(processChainStub.calledOnce).to.be.true;

    clock.tick(interval / 2);
    expect(processChainStub.calledTwice).to.be.true;
  });
});
