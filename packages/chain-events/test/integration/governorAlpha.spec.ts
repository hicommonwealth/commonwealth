/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
/* eslint-disable no-unused-expressions */
import { EventEmitter } from 'events';

import type { Signer, BigNumberish } from 'ethers';
import { providers } from 'ethers';
import chai, { expect } from 'chai';

import type {
  MPond,
  GovernorAlphaMock as GovernorAlpha,
  TimelockMock as Timelock,
} from '../../src/contractTypes';
import {
  MPond__factory as MPondFactory,
  GovernorAlphaMock__factory as GovernorAlphaFactory,
  TimelockMock__factory as TimelockFactory,
} from '../../src/contractTypes';
import type {
  Api,
  IEventData,
  IProposalCreated,
  IProposalQueued,
  IProposalExecuted,
  IVoteCast,
} from 'chain-events/src/chain-bases/EVM/compound/types';
import {
  EventKind,
  ProposalState,
} from 'chain-events/src/chain-bases/EVM/compound/types';
import { subscribeEvents } from 'chain-events/src/chain-bases/EVM/compound/subscribeFunc';
import type { CWEvent, IChainEventData } from '../../src/interfaces';
import { IEventHandler } from '../../src/interfaces';

const { assert } = chai;

function getProvider(): providers.Web3Provider {
  const web3Provider = require('ganache-cli').provider({
    allowUnlimitedContractSize: true,
    gasLimit: 1000000000,
    time: new Date(1000),
    mnemonic: 'Alice',
    // logger: console,
  });
  return new providers.Web3Provider(web3Provider);
}

async function deployMPond(
  signer: Signer | providers.JsonRpcSigner,
  account: string,
  bridge: string
): Promise<MPond> {
  const factory = new MPondFactory(signer);
  const comp = await factory.deploy(account, bridge);
  return comp;
}

async function deployGovernorAlpha(
  signer: Signer | providers.JsonRpcSigner,
  timelock: string,
  comp: string,
  guardian: string
): Promise<GovernorAlpha> {
  const factory = new GovernorAlphaFactory(signer);
  const governorAlpha = await factory.deploy(timelock, comp, guardian);
  return governorAlpha;
}

async function deployTimelock(
  signer: Signer | providers.JsonRpcSigner,
  admin: string,
  delay: BigNumberish
): Promise<Timelock> {
  const factory = new TimelockFactory(signer);
  const timelock = await factory.deploy(admin, delay);
  return timelock;
}

class CompoundEventHandler extends IEventHandler {
  constructor(public readonly emitter: EventEmitter) {
    super();
  }

  public async handle(event: CWEvent<IEventData>): Promise<IChainEventData> {
    this.emitter.emit(event.data.kind.toString(), event);
    return null;
  }
}

function assertEvent<T extends IEventData>(
  handler: CompoundEventHandler,
  event: EventKind,
  cb: (evt: CWEvent<T>) => void
) {
  return new Promise<void>((resolve, reject) => {
    handler.emitter.on(event, (evt: CWEvent<T>) => {
      try {
        cb(evt);
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  });
}
interface ISetupData {
  api: Api;
  comp: MPond;
  timelock: Timelock;
  governorAlpha: GovernorAlpha;
  addresses: string[];
  provider: providers.Web3Provider;
  handler: CompoundEventHandler;
}

async function setupSubscription(subscribe = true): Promise<ISetupData> {
  const provider = getProvider();
  const addresses: string[] = await provider.listAccounts();
  const [member, bridge] = addresses;
  const signer = provider.getSigner(member);

  // Deploy contracts.
  const comp = await deployMPond(signer, member, bridge);
  const timelock = await deployTimelock(signer, member, 2 * 60); // 2 minutes delay
  const governorAlpha = await deployGovernorAlpha(
    signer,
    timelock.address,
    comp.address,
    member
  );

  // TODO: Adminship seems messed up, can't do queue() calls
  // await governorAlpha.__executeSetTimelockPendingAdmin(member, 0);
  // console.log('member: ', member);
  // console.log('timelock admin address: ', await timelock.admin());
  // console.log('governorAlpha guardian:', await governorAlpha.guardian());
  const api = governorAlpha;
  const emitter = new EventEmitter();
  const handler = new CompoundEventHandler(emitter);
  if (subscribe) {
    await subscribeEvents({
      chain: 'marlin-local',
      api,
      handlers: [handler],
      // skipCatchup: true,
    });
  }
  return { api, comp, timelock, governorAlpha, addresses, provider, handler };
}

async function performDelegation(
  handler: CompoundEventHandler,
  comp: MPond,
  from: string,
  to: string,
  amount: BigNumberish
): Promise<void> {
  await comp.delegate(to, amount);
  /*
  await Promise.all([
    assertEvent(handler, EventKind.DelegateChanged, (evt) => {
      assert.deepEqual(evt.data, {
        kind: EventKind.DelegateChanged,
        delegator: from,
        toDelegate: to,
        fromDelegate: '0x0000000000000000000000000000000000000000',
      });
    }),
    assertEvent(
      handler,
      EventKind.DelegateVotesChanged,
      (evt: CWEvent<IDelegateVotesChanged>) => {
        const { kind, delegate, previousBalance, newBalance } = evt.data;
        assert.deepEqual(
          {
            kind,
            delegate,
            previousBalance: previousBalance.toString(),
            newBalance: newBalance.toString(),
          },
          {
            kind: EventKind.DelegateVotesChanged,
            delegate: to,
            previousBalance: '0',
            newBalance: amount.toString(),
          }
        );
      }
    ),
  ]);
  */
}

async function createProposal(
  handler: CompoundEventHandler,
  gov: GovernorAlpha,
  comp: MPond,
  from: string
): Promise<void> {
  const proposalMinimum = await gov.proposalThreshold();
  const delegateAmount = proposalMinimum.mul(3);
  await performDelegation(handler, comp, from, from, delegateAmount);

  const targets = ['0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b'];
  const values = ['0'];
  const signatures = ['_setCollateralFactor(address,uint256)'];
  const calldatas = [
    '0x000000000000000000000000C11B1268C1A384E55C48C2391D8D480264A3A7F40000000000000000000000000000000000000000000000000853A0D2313C0000',
  ];
  await gov.propose(targets, values, signatures, calldatas, 'test description');
  await assertEvent(
    handler,
    EventKind.ProposalCreated,
    (evt: CWEvent<IProposalCreated>) => {
      const { kind, proposer } = evt.data;
      assert.deepEqual(
        {
          kind,
          proposer,
        },
        {
          kind: EventKind.ProposalCreated,
          proposer: from,
        }
      );
    }
  );
}

async function proposeAndVote(
  handler: CompoundEventHandler,
  provider: providers.Web3Provider,
  gov: GovernorAlpha,
  comp: MPond,
  from: string,
  voteYes: boolean
) {
  await createProposal(handler, gov, comp, from);

  // Wait for proposal to activate
  const activeProposals = await gov.latestProposalIds(from);
  const { startBlock } = await gov.proposals(activeProposals);
  const currentBlock = await provider.getBlockNumber();
  const blockDelta = startBlock.sub(currentBlock).add(1);
  const timeDelta = blockDelta.mul(15);
  await provider.send('evm_increaseTime', [+timeDelta]);
  for (let i = 0; i < +blockDelta; ++i) {
    await provider.send('evm_mine', []);
  }

  const state = await gov.state(activeProposals);
  expect(state).to.be.equal(ProposalState.Active);

  // VoteCast Event
  const voteWeight = await comp.getPriorVotes(from, startBlock);
  await gov.castVote(activeProposals, voteYes);
  await assertEvent(handler, EventKind.VoteCast, (evt: CWEvent<IVoteCast>) => {
    assert.deepEqual(evt.data, {
      kind: EventKind.VoteCast,
      id: activeProposals.toHexString(),
      voter: from,
      support: +voteYes,
      votes: voteWeight.toString(),
      reason: undefined,
    });
  });
}

async function proposeAndWait(
  handler: CompoundEventHandler,
  provider: providers.Web3Provider,
  gov: GovernorAlpha,
  comp: MPond,
  from: string,
  voteYes: boolean
) {
  await proposeAndVote(handler, provider, gov, comp, from, voteYes);
  const activeProposals = await gov.latestProposalIds(from);

  const votingPeriodInBlocks = +(await gov.votingPeriod());
  await provider.send('evm_increaseTime', [votingPeriodInBlocks * 15]);
  for (let i = 0; i < votingPeriodInBlocks; i++) {
    await provider.send('evm_mine', []);
  }
  const state = await gov.state(activeProposals);
  if (voteYes) {
    expect(state).to.be.equal(ProposalState.Succeeded);
  } else {
    expect(state).to.be.equal(ProposalState.Defeated); // 3 is 'Defeated'
  }
}

async function proposeAndQueue(
  handler: CompoundEventHandler,
  provider: providers.Web3Provider,
  gov: GovernorAlpha,
  comp: MPond,
  from: string
) {
  await proposeAndWait(handler, provider, gov, comp, from, true);

  const activeProposals = await gov.latestProposalIds(from);
  await gov.queue(activeProposals);
  await Promise.all([
    assertEvent(
      handler,
      EventKind.ProposalQueued,
      (evt: CWEvent<IProposalQueued>) => {
        const { kind, id } = evt.data;
        assert.deepEqual(
          {
            kind,
            id,
          },
          {
            kind: EventKind.ProposalQueued,
            id: activeProposals.toHexString(),
          }
        );
      }
    ),
  ]);
}

describe('Governor Alpha Integration Tests', () => {
  describe('COMP contract function events', () => {
    it('initial address should transfer tokens to an address', async () => {
      const { comp, addresses } = await setupSubscription();
      // test volume
      const initialBalance = await comp.balanceOf(addresses[0]);
      expect(+initialBalance).to.not.be.equal(0);
      const newUser = await comp.balanceOf(addresses[2]);
      assert.isAtMost(+newUser, 0);
      assert.isAtLeast(+initialBalance, 100000);
      await comp.transfer(addresses[2], 100);
      const newUserNewBalance = await comp.balanceOf(addresses[2]);
      assert.isAtLeast(+newUserNewBalance, 100);
      /*
      await assertEvent(
        handler,
        EventKind.Transfer,
        (evt: CWEvent<ITransfer>) => {
          const { kind, from, to, amount } = evt.data;
          assert.deepEqual(
            {
              kind,
              from,
              to,
              amount: amount.toString(),
            },
            {
              kind: EventKind.Transfer,
              from: addresses[0],
              to: addresses[2],
              amount: newUserNewBalance.toString(),
            }
          );
        }
      );
      */
    });

    it('initial address should delegate to address 2', async () => {
      const { comp, addresses, handler } = await setupSubscription();
      await performDelegation(handler, comp, addresses[0], addresses[2], 1000);
    });

    it('initial address should delegate to itself', async () => {
      const { comp, addresses, handler } = await setupSubscription();
      await performDelegation(handler, comp, addresses[0], addresses[0], 1000);
    });
  });

  describe('GovernorAlpha contract function events', () => {
    it('should create a proposal', async () => {
      const { governorAlpha, comp, addresses, handler } =
        await setupSubscription();
      await createProposal(handler, governorAlpha, comp, addresses[0]);
    });

    it('proposal castvote', async () => {
      const { governorAlpha, comp, addresses, handler, provider } =
        await setupSubscription();
      await proposeAndVote(
        handler,
        provider,
        governorAlpha,
        comp,
        addresses[0],
        true
      );
    });

    it('should fail once not active', async () => {
      const { governorAlpha, comp, addresses, handler, provider } =
        await setupSubscription();
      await proposeAndWait(
        handler,
        provider,
        governorAlpha,
        comp,
        addresses[0],
        false
      );
    });

    it('should succeed once not active', async () => {
      const { governorAlpha, comp, addresses, handler, provider } =
        await setupSubscription();
      await proposeAndWait(
        handler,
        provider,
        governorAlpha,
        comp,
        addresses[0],
        true
      );
    });

    it('should be queued and executed', async () => {
      const { governorAlpha, comp, addresses, handler, provider } =
        await setupSubscription();
      await proposeAndQueue(
        handler,
        provider,
        governorAlpha,
        comp,
        addresses[0]
      );
      const activeProposals = await governorAlpha.latestProposalIds(
        addresses[0]
      );
      await governorAlpha.execute(activeProposals);
      await Promise.all([
        assertEvent(
          handler,
          EventKind.ProposalExecuted,
          (evt: CWEvent<IProposalExecuted>) => {
            const { kind, id } = evt.data;
            assert.deepEqual(
              {
                kind,
                id,
              },
              {
                kind: EventKind.ProposalExecuted,
                id: activeProposals.toHexString(),
              }
            );
          }
        ),
      ]);
    });

    it('should expire in queue', async () => {
      const { governorAlpha, comp, timelock, addresses, handler, provider } =
        await setupSubscription();
      await proposeAndQueue(
        handler,
        provider,
        governorAlpha,
        comp,
        addresses[0]
      );

      // advance beyond grace period so it expires despite successful votes
      const activeProposals = await governorAlpha.latestProposalIds(
        addresses[0]
      );
      const gracePeriod = await timelock.GRACE_PERIOD();
      const proposal = await governorAlpha.proposals(activeProposals);
      const expirationTime = +gracePeriod.add(proposal.eta);
      const currentBlock = await provider.getBlockNumber();
      const { timestamp } = await provider.getBlock(currentBlock);
      const timeUntilExpiration = expirationTime - timestamp;
      const timeToAdvance = timeUntilExpiration + 15;
      const blocksToAdvance = Math.ceil(timeToAdvance / 15);
      await provider.send('evm_increaseTime', [timeToAdvance]);
      for (let i = 0; i < blocksToAdvance; i++) {
        await provider.send('evm_mine', []);
      }

      // ensure state is set to expired
      const state = await governorAlpha.state(activeProposals);
      expect(state).to.be.equal(ProposalState.Expired);
    });
  });
});
