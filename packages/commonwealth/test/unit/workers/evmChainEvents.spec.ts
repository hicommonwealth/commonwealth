import chai, { expect } from 'chai';
import sinon from 'sinon';
import {
  EventRpcSources,
  scheduleBlockFetching,
} from '../../../server/workers/evmChainEvents/startEvmPolling';
import { EvmEventSourceInstance } from '../../../server/models/evmEventSource';
import models from '../../../server/database';

describe.only('Tests for EvmChainEvents', () => {
  describe('Tests for scheduling block fetching and processing', () => {
    const rpc = 'http://localhost:8545';
    const sandbox = sinon.createSandbox();
    let processChainStub: sinon.SinonSpy;
    let clock: sinon.SinonFakeTimers;

    beforeEach(() => {
      processChainStub = sandbox.stub();
      clock = sandbox.useFakeTimers();
    });

    afterEach(() => {
      sandbox.restore();
    });

    it.only('should not schedule anything if there are no event sources', async () => {
      const eventSources = {};
      const interval = 1000;
      scheduleBlockFetching(eventSources, interval, processChainStub);
      expect(processChainStub.called).to.be.false;
    });

    it.only('should schedule processing for a single source', async () => {
      const eventRpcSources: EventRpcSources = {
        [rpc]: [
          models.EvmEventSource.build({
            id: 1,
            chain_node_id: 1,
            contract_address: '0x123',
            event_signature: '0x456',
            kind: 'proposal-created',
          }),
        ],
      };

      const interval = 10000;
      scheduleBlockFetching(eventRpcSources, interval, processChainStub);

      expect(processChainStub.calledOnce).to.be.false;

      clock.tick(1);
      expect(processChainStub.calledOnce).to.be.true;

      clock.tick(interval);
      expect(processChainStub.calledTwice).to.be.true;

      clock.tick(interval);
      expect(processChainStub.calledThrice).to.be.true;
    });

    it.only('should evenly schedule 2 sources per interval', async () => {
      const rpc2 = 'http://localhost:8546';
      const eventRpcSources: EventRpcSources = {
        [rpc]: [
          models.EvmEventSource.build({
            id: 1,
            chain_node_id: 1,
            contract_address: '0x123',
            event_signature: '0x456',
            kind: 'proposal-created',
          }),
        ],
        [rpc2]: [
          models.EvmEventSource.build({
            id: 1,
            chain_node_id: 2,
            contract_address: '0x123',
            event_signature: '0x456',
            kind: 'proposal-created',
          }),
        ],
      };

      const interval = 10000;
      scheduleBlockFetching(eventRpcSources, interval, processChainStub);

      expect(processChainStub.calledOnce).to.be.false;
      clock.tick(1);
      expect(processChainStub.calledOnce).to.be.true;
      expect(processChainStub.calledWith(rpc, eventRpcSources[rpc])).to.be.true;

      clock.tick(interval / 2);
      expect(processChainStub.calledTwice).to.be.true;
      expect(processChainStub.calledWith(rpc2, eventRpcSources[rpc2])).to.be
        .true;

      clock.tick(interval / 2);
      expect(processChainStub.calledThrice).to.be.true;
      expect(processChainStub.calledWith(rpc, eventRpcSources[rpc])).to.be.true;

      clock.tick(interval / 2);
      expect(processChainStub.callCount).to.equal(4);
      expect(processChainStub.calledWith(rpc2, eventRpcSources[rpc2])).to.be
        .true;
    });
  });

  describe('Tests for fetching event sources');
});
