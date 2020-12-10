import { providers } from 'ethers';
import chai, { expect } from 'chai';
import { EventEmitter } from 'events';
import { MPondFactory } from '../../eth/types/MPondFactory';
import { MPond } from '../../eth/types/MPond';
import { GovernorAlphaFactory } from '../../eth/types/GovernorAlphaFactory';
import { GovernorAlpha } from '../../eth/types/GovernorAlpha';
import { TimelockFactory } from '../../eth/types/TimelockFactory';
import { Timelock } from '../../eth/types/Timelock';
import { Api, IEventData, EventKind, IDelegateVotesChanged, ITransfer, IProposalCreated, IProposalCanceled, ICancelTransaction, IProposalQueued, IProposalExecuted, IQueueTransaction, IExecuteTransaction } from '../../src/marlin/types';
import { subscribeEvents } from '../../src/marlin/subscribeFunc';
import { IEventHandler, CWEvent } from '../../src/interfaces';
import { Provider } from 'ethers/providers';
import { compact } from 'underscore';
import { bytesToHex, hexToBytes, hexToNumber, toHex } from 'web3-utils';
import { resolve } from 'path';

const { assert } = chai;

function getProvider(): providers.Web3Provider {
  // eslint-disable-next-line global-require
  const web3Provider = require('ganache-cli').provider({
    allowUnlimitedContractSize: true,
    gasLimit: 1000000000,
    time: new Date(1000),
    pnuemonic: 'Alice',
    // logger: console,
  });
  return new providers.Web3Provider(web3Provider);
}

async function deployMPond(signer, account: string, bridge: string) {
  const factory = new MPondFactory(signer);
  const comp = await factory.deploy(account, bridge);
  return comp;
}

async function deployGovernorAlpha(signer, timelock, comp, guardian) {
  const factory = new GovernorAlphaFactory(signer);
  const governorAlpha = await factory.deploy(timelock, comp, guardian);
  return governorAlpha;
}

async function deployTimelock(signer, admin, delay) {
  const factory = new TimelockFactory(signer);
  const timelock = await factory.deploy(admin, delay);
  return timelock;
}

class MarlinEventHandler extends IEventHandler {
  constructor(
    public readonly emitter: EventEmitter,
  ) {
    super();
  }

  public async handle(event: CWEvent<IEventData>): Promise<any> {
    this.emitter.emit(event.data.kind.toString(), event);
    this.emitter.emit('*', event);
  }
}

interface ISetupData {
  api: Api;
  comp: MPond;
  timelock: Timelock;
  governorAlpha: GovernorAlpha;
  addresses: string[];
  provider: providers.Web3Provider;
  handler: MarlinEventHandler;
}

async function setupSubscription(subscribe = true): Promise<ISetupData> {
  const provider = getProvider();
  const addresses: string[] = await provider.listAccounts();
  const [ member, bridge ] = addresses;
  const signer = provider.getSigner(member);
  const comp = await deployMPond(signer, member, bridge);
  const timelock = await deployTimelock(signer, member, 172800);
  const governorAlpha = await deployGovernorAlpha(signer, timelock.address, comp.address, member);
  // await timelock.setPendingAdmin(governorAlpha.address, { from: timelock.address});
  // console.log('timelock admin address: ', await timelock.admin());
  // console.log('governorAlpha Address:', governorAlpha.address);
  // TODO: Fix this somehow, need to make governorAlpha admin of timelock... :le-penseur:
  const api = { comp, governorAlpha, timelock };
  const emitter = new EventEmitter();
  const handler = new MarlinEventHandler(emitter);
  if (subscribe) {
    await subscribeEvents({
      chain: 'marlin-local',
      api,
      handlers: [handler],
      // skipCatchup: true,
    })
  }
  return { api, comp, timelock, governorAlpha, addresses, provider, handler, };
}

const COMP_THRESHOLD = 100000e18;

describe('Marlin Event Integration Tests', () => {
  let api, comp, timelock, governorAlpha, addresses, provider, handler;

  before('should setup a new subscription', async () => {
    const setup = await setupSubscription();
    api = setup.api;
    comp = setup.comp;
    timelock = setup.timelock;
    governorAlpha = setup.governorAlpha;
    addresses = setup.addresses;
    provider = setup.provider;
    handler = setup.handler;
  });
  it('should deploy all three contracts', async () => {
    expect(api).to.not.be.null;
    expect(comp).to.not.be.null;
    expect(timelock).to.not.be.null;
    expect(governorAlpha).to.not.be.null;
    expect(addresses).to.not.be.null;
    expect(provider).to.not.be.null;
    expect(handler).to.not.be.null;
  });

  describe('COMP contract function events', () => {
    it('initial address should have all the tokens ', async () => {
      // test volume
      const balance = await comp.balanceOf(addresses[0]);
      expect(balance).to.not.be.equal(0);
    });
    it('initial address should transfer tokens to an address', async () => {
      const initialBalance = await comp.balanceOf(addresses[0]);
      const newUser = await comp.balanceOf(addresses[2]);
      assert.isAtMost(+newUser, 0)
      assert.isAtLeast(+initialBalance, 100000);
      await comp.transfer(addresses[2], 100);
      const newUserNewBalance = await comp.balanceOf(addresses[2]);
      assert.isAtLeast(+newUserNewBalance, 100);
      await new Promise((resolve) => {
        handler.emitter.on(
          EventKind.Transfer.toString(),
          (evt: CWEvent<ITransfer>) => {
            const { kind, from, to, amount } = evt.data;
            assert.deepEqual({
              kind,
              from,
              to,
              amount: amount.toString()
            }, {
              kind: EventKind.Transfer,
              from: addresses[0],
              to: addresses[2],
              amount: newUserNewBalance.toString(),
            })
            resolve();
          }
        );
      });
    });
    it('initial address should delegate to address 2', async () => {
      const initialBalance = await comp.balanceOf(addresses[0]);
      // delegate
      await comp.delegate(addresses[2], 1000);
      await Promise.all([
        handler.emitter.on(
          EventKind.DelegateChanged.toString(),
          (evt: CWEvent<IEventData>) => {
            assert.deepEqual(evt.data, {
              kind: EventKind.DelegateChanged,
              delegator: addresses[0],
              toDelegate: addresses[2],
              fromDelegate: '0x0000000000000000000000000000000000000000',
            });
            resolve();
          }
        ),
        handler.emitter.on(
          EventKind.DelegateVotesChanged.toString(),
          (evt: CWEvent<IDelegateVotesChanged>) => {
            const { kind, delegate, previousBalance, newBalance, } = evt.data;
            assert.deepEqual({
              kind,
              delegate,
              previousBalance: previousBalance.toString(),
              newBalance: newBalance.toString(),
            }, {
              kind: EventKind.DelegateVotesChanged,
              delegate: addresses[2],
              previousBalance: '0',
              newBalance: initialBalance.toString(),
            });
            resolve();
          }
        ),
      ])
    });
    it('initial address should delegate to itself', async () => {
      // DelegateChanged & Delegate Votes Changed Events
      const initialBalance = await comp.balanceOf(addresses[0]);
      const newUser = await comp.balanceOf(addresses[1]);
      // delegate
      await comp.delegate(addresses[0], 1000);
      await Promise.all([
        handler.emitter.on(
          EventKind.DelegateChanged.toString(),
          (evt: CWEvent<IEventData>) => {
            assert.deepEqual(evt.data, {
              kind: EventKind.DelegateChanged,
              delegator: addresses[0],
              toDelegate: addresses[0],
              fromDelegate: '0x0000000000000000000000000000000000000000',
            });
            resolve();
          }
        ),
        handler.emitter.on(
          EventKind.DelegateVotesChanged.toString(),
          (evt: CWEvent<IDelegateVotesChanged>) => {
            const { kind, delegate, previousBalance, newBalance, } = evt.data;
            assert.deepEqual({
              kind,
              delegate,
              previousBalance: previousBalance.toString(),
              newBalance: newBalance.toString(),
            }, {
              kind: EventKind.DelegateVotesChanged,
              delegate: addresses[0],
              previousBalance: '0',
              newBalance: initialBalance.toString(),
            });
            resolve();
          }
        )
      ]);
    });
  });

  describe('GovernorAlpha contract function events', () => {
    let proposal;
    before('it should setupSubscriber and delegate', async () => {
      const initialBalance = await comp.balanceOf(addresses[0]);
      const proposalMinimum = await governorAlpha.proposalThreshold();
      await comp.delegate(addresses[0], proposalMinimum);
      await Promise.all([
        handler.emitter.on(
          EventKind.DelegateChanged.toString(),
          (evt: CWEvent<IEventData>) => {
            assert.deepEqual(evt.data, {
              kind: EventKind.DelegateChanged,
              delegator: addresses[0],
              toDelegate: addresses[0],
              fromDelegate: '0x0000000000000000000000000000000000000000',
            });
            resolve();
          }
        ),
        handler.emitter.on(
          EventKind.DelegateVotesChanged.toString(),
          (evt: CWEvent<IDelegateVotesChanged>) => {
            const { kind, delegate, previousBalance, newBalance } = evt.data;
            assert.deepEqual({
              kind,
              delegate,
              previousBalance: previousBalance.toString(),
              newBalance: newBalance.toString(),
            }, {
              kind: EventKind.DelegateVotesChanged,
              delegate: addresses[0],
              previousBalance: '0',
              newBalance: initialBalance.toString(),
            });
            resolve();
          }
        )
      ]);
    });
    it('should create a proposal', async () => {
      // ProposalCreated Event
      const targets = [
        '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b',
      ];
      const values = [0,];
      const signatures = [
        '_setCollateralFactor(address,uint256)'
      ];
      const calldatas = [
        '0x000000000000000000000000C11B1268C1A384E55C48C2391D8D480264A3A7F40000000000000000000000000000000000000000000000000853A0D2313C0000',
      ];
      proposal = await governorAlpha.propose(targets, values, signatures, calldatas, 'test description');
      await new Promise((resolve) => {
        handler.emitter.on(
          EventKind.ProposalCreated.toString(),
          (evt: CWEvent<IProposalCreated>) => {
            const {kind, proposer, description } = evt.data;
            assert.deepEqual({
              kind,
              proposer,
              description,
            }, {
              kind: EventKind.ProposalCreated,
              proposer: addresses[0],
              description: 'test description',
            });
            resolve();
          }
        )
      });
    });
    it('proposal castvote', async () => {
      // ProposalCreated Event
      // VoteCast Event
      const activeProposals = await governorAlpha.latestProposalIds(addresses[0]);
      await provider.send('evm_increaseTime', [1]);
      await provider.send('evm_mine', []);
      const vote = await governorAlpha.castVote(activeProposals, true);
      assert.notEqual(vote, null);
    });

    xit('should succeed upon 3 days simulation (should take awhile, lag)', async (done) => {
      const activeProposals = await governorAlpha.latestProposalIds(addresses[0]);
      await provider.send('evm_increaseTime', [19500]); // 3 x 6500 (blocks/day)
      for (let i=0; i < 19500; i++) {
        await provider.send('evm_mine', []);
      }
      const state = await governorAlpha.state(activeProposals)
      expect(state).to.be.equal(4); // 4 is 'Succeeded'
    }).timeout(1000000);;

    xit('should be queued and executed', async (done) => {
      const activeProposals = await governorAlpha.latestProposalIds(addresses[0]);
      await governorAlpha.queue(activeProposals);
      await Promise.all([
        handler.emitter.on(
          EventKind.ProposalQueued.toString(),
          (evt: CWEvent<IProposalQueued>) => {
            const {kind, id, eta } = evt.data;
            assert.deepEqual({
              kind,
              id,
            }, {
              kind: EventKind.ProposalQueued,
              id: activeProposals,
            });
            resolve();
          }
        ),
        handler.emitter.on(
          EventKind.QueueTransaction.toString(),
          (evt: CWEvent<IQueueTransaction>) => {
            const {kind, } = evt.data;
            assert.deepEqual({
              kind,
            }, {
              kind: EventKind.QueueTransaction,
            });
            resolve();
          }
        ),
      ]);
      await governorAlpha.execute(activeProposals);
      await Promise.all([
        handler.emitter.on(
          EventKind.ProposalExecuted.toString(),
          (evt: CWEvent<IProposalExecuted>) => {
            const {kind, id } = evt.data;
            assert.deepEqual({
              kind,
              id,
            }, {
              kind: EventKind.ProposalExecuted,
              id: activeProposals,
            });
            resolve();
          }
        ),
        handler.emitter.on(
          EventKind.ExecuteTransaction.toString(),
          (evt: CWEvent<IExecuteTransaction>) => {
            const {kind, } = evt.data;
            assert.deepEqual({
              kind,
            }, {
              kind: EventKind.ExecuteTransaction,
            });
            resolve();
          }
        ),
      ]);
      done();
    });
  });
});