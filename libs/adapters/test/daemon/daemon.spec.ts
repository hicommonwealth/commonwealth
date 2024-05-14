// import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import { Daemons } from '../../src/daemon';

describe('Daemon', () => {
  let clock: sinon.SinonFakeTimers;

  before(function () {
    clock = sinon.useFakeTimers();
  });

  after(function () {
    clock.restore();
  });

  describe('startTask', () => {
    it('should call fn immediately', () => {
      const daemons = new Daemons();
      const fn = sinon.spy();
      daemons.startTask('test', fn, 60);
      expect(fn.calledOnce).to.be.true;
      daemons.cancelTask('test');
    });

    it('should call fn every 60 seconds', () => {
      const daemons = new Daemons();
      const fn = sinon.spy();
      daemons.startTask('test', fn, 60);
      expect(fn.calledOnce).to.be.true;
      clock.tick(60 * 1000);
      expect(fn.calledTwice).to.be.true;
      daemons.cancelTask('test');
    });

    it('should call async fn every 60 seconds', () => {
      const daemons = new Daemons();
      const fn = sinon.spy(async () => {
        await Promise.resolve('abc');
      });
      daemons.startTask('test', fn, 60);
      expect(fn.calledOnce).to.be.true;
      clock.tick(60 * 1000);
      expect(fn.calledTwice).to.be.true;
      daemons.cancelTask('test');
    });

    it('should not call fn if ms < 60*1000', () => {
      const daemons = new Daemons();
      const fn = sinon.spy();
      const jobId = daemons.startTask('test', fn, 59);
      expect(jobId).to.be.undefined;
      expect(fn.calledOnce).to.be.false;
      clock.tick(59 * 1000);
      expect(fn.calledTwice).to.be.false;
    });

    it('should cancel old task if it exists', () => {
      const daemons = new Daemons();
      const fn = sinon.spy();
      const fn2 = sinon.spy();

      const job1 = daemons.startTask('test', fn, 60);
      expect(job1).to.not.be.undefined;
      expect(fn.calledOnce).to.be.true;
      clock.tick(60 * 1000);
      expect(fn.calledTwice).to.be.true;
      expect(daemons['tasks'].size).to.equal(1);
      expect(daemons.getTask('test')).to.equal(job1);

      const job2 = daemons.startTask('test', fn2, 60);
      expect(job2).to.not.be.undefined;
      expect(daemons['tasks'].size).to.equal(1);
      expect(daemons.getTask('test')).to.equal(job2);
      expect(job1).to.not.equal(job2);
      expect(fn2.calledOnce).to.be.true;
      clock.tick(60 * 1000);
      expect(fn2.calledTwice).to.be.true;
      clock.tick(60 * 1000);
      expect(fn.calledThrice).to.be.false;

      daemons.cancelTask('test');
      expect(daemons['tasks'].size).to.equal(0);
    });

    it('call fn with binded this and params', () => {
      const daemons = new Daemons();
      const fn = sinon.spy();
      const obj = { a: 1 };
      daemons.startTask('test', fn.bind(obj, 1, 2), 60);
      expect(fn.calledOnce).to.be.true;
      expect(fn.calledWith(1, 2)).to.be.true;
      expect(fn.thisValues[0]).to.equal(obj);
      clock.tick(60 * 1000);
      expect(fn.calledTwice).to.be.true;
      expect(fn.calledWith(1, 2)).to.be.true;
      expect(fn.thisValues[1]).to.equal(obj);
      daemons.cancelTask('test');
    });

    it('should not call fn if it throws error', () => {
      const daemons = new Daemons();
      const fn = sinon.spy(() => {
        throw new Error('test');
      });
      const jobId = daemons.startTask('test', fn, 60);
      expect(jobId).to.be.undefined;
      expect(daemons['tasks'].size).to.equal(0);
      expect(fn.calledOnce).to.be.true;
      expect(daemons.getTask('test')).to.equal(undefined);
      clock.tick(60 * 1000);
      expect(fn.calledTwice).to.be.false;
      expect(fn.threw()).to.be.true;
    });

    it('should cancel fn if it throws error', () => {
      const daemons = new Daemons();
      let timesCalled = 0;
      const fn = sinon.spy(() => {
        if (timesCalled == 2) {
          throw new Error('test');
        }
        timesCalled++;
      });
      const jobId = daemons.startTask('test', fn, 60);
      expect(jobId).to.be.not.undefined;
      expect(daemons['tasks'].size).to.equal(1);
      expect(fn.calledOnce).to.be.true;
      expect(daemons.getTask('test')).to.equal(jobId);

      clock.tick(60 * 1000);
      expect(fn.calledTwice).to.be.true;
      expect(fn.threw()).to.be.false;

      clock.tick(60 * 1000);
      expect(fn.calledThrice).to.be.true;
      expect(fn.threw()).to.be.true;
      expect(daemons['tasks'].size).to.equal(0);
      expect(daemons.getTask('test')).to.equal(undefined);
    });
  });

  describe('cancelTask', () => {
    it('should cancel task', () => {
      const daemons = new Daemons();
      const fn = sinon.spy();
      daemons.startTask('test', fn, 120);
      daemons.cancelTask('test');
      expect(fn.calledOnce).to.be.true;
      clock.tick(120 * 1000);
      expect(fn.calledTwice).to.be.false;
      expect(daemons['tasks'].size).to.equal(0);
    });

    it('should not cancel task if it does not exist', () => {
      const daemons = new Daemons();
      const fn = sinon.spy();
      daemons.startTask('test', fn, 60);
      daemons.cancelTask('test2');
      expect(fn.calledOnce).to.be.true;
      clock.tick(60 * 1000);
      expect(fn.calledTwice).to.be.true;
      expect(daemons['tasks'].size).to.equal(1);
    });

    it('task cancel from outside, should not throw error', () => {
      const daemons = new Daemons();
      const fn = sinon.spy();
      const jobId = daemons.startTask('test', fn, 60);
      expect(fn.calledOnce).to.be.true;
      clock.tick(60 * 1000);
      expect(fn.calledTwice).to.be.true;
      clearInterval(jobId!);
      clock.tick(60 * 1000);
      expect(fn.calledThrice).to.be.false;
      expect(daemons['tasks'].size).to.equal(1);
      expect(daemons.getTask('test')).to.equal(jobId);
      expect(daemons.cancelTask('test')).to.be.true;
      expect(daemons['tasks'].size).to.equal(0);
    });
  });

  describe('backgroundJob', () => {
    it('should not accept to run jobs more often than 1 minute', () => {
      const daemons = new Daemons();
      const fn = sinon.spy();
      const jobId = daemons.backgroundJob('test', fn, 59 * 1000);
      expect(jobId).to.be.undefined;
      clearInterval(jobId!);
    });

    it('should accept to run jobs more often than 1 minute', () => {
      const daemons = new Daemons();
      const fn = sinon.spy();
      const jobId = daemons.backgroundJob('test', fn, 60 * 1000);
      expect(jobId).to.not.be.undefined;
      clearInterval(jobId!);
    });

    it('should clear interval, if fn throw error', () => {
      const daemons = new Daemons();
      const fn = sinon.spy(() => {
        throw new Error('test');
      });
      const jobId = daemons.backgroundJob('test', fn, 60 * 1000);
      expect(jobId).to.not.be.undefined;
      clock.tick(60 * 1000);
      expect(fn.calledOnce).to.be.true;
      expect(fn.threw()).to.be.true;
      clock.tick(60 * 1000);
      expect(fn.calledTwice).to.be.false;
    });
  });
});
