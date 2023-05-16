/* eslint-disable func-names */
import '@nomiclabs/hardhat-ethers';
import { EventEmitter } from 'events';

import chai, { expect } from 'chai';
import { ethers } from 'hardhat';
import { BigNumber } from 'ethers';
import type { Signer, providers, BigNumberish } from 'ethers';

import type {
  GovernorBravoImmutable,
  MPond,
  TimelockMock as Timelock,
} from '../../src/contractTypes';
import {
  GovernorBravoImmutable__factory as GovernorBravoImmutableFactory,
  MPond__factory as MPondFactory,
  TimelockMock__factory as TimelockFactory,
} from '../../src/contractTypes';
import type {
  Api,
  IEventData,
  IProposalCanceled,
  IProposalCreated,
  IProposalExecuted,
  IProposalQueued,
  IVoteCast,
} from 'chain-events/src/chain-bases/EVM/compound/types';
import {
  BravoSupport,
  EventKind,
  ProposalState,
} from 'chain-events/src/chain-bases/EVM/compound/types';
import {
  createApi,
  StorageFetcher,
  subscribeEvents,
} from '../../src/chain-bases/EVM/compound';
import type { CWEvent, IChainEventData } from '../../src';
import { IEventHandler, SupportedNetwork } from '../../src';

const { assert } = chai;

async function deployMPond(
  signer: Signer | providers.JsonRpcSigner,
  account: string,
  bridge: string
): Promise<MPond> {
  const factory = new MPondFactory(signer);
  const comp = await factory.deploy(account, bridge);
  return comp;
}

async function deployTimelock(
  signer: Signer | providers.JsonRpcSigner,
  admin: string,
  delay: BigNumberish
): Promise<Timelock> {
  const factory = new TimelockFactory(signer);
  return factory.deploy(admin, delay);
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
  GovernorBravo: GovernorBravoImmutable;
  addresses: string[];
  provider: providers.JsonRpcProvider;
  handler: CompoundEventHandler;
}

async function setupSubscription(): Promise<ISetupData> {
  // eslint-disable-next-line prefer-destructuring
  const provider = ethers.provider;
  const addresses: string[] = await provider.listAccounts();
  const [member, bridge] = addresses;
  const signer = provider.getSigner(member);

  // deploy timelock
  const timelock = await deployTimelock(signer, member, 2 * 60); // 2 minutes delay

  // deploy comp
  const comp = await deployMPond(signer, member, bridge);

  // deploy delegate
  const factory = new GovernorBravoImmutableFactory(signer);
  const bravo = await factory.deploy(
    timelock.address,
    comp.address,
    member,
    10,
    1,
    1
  );

  // Call our custom function to set initial proposal id.
  // This is necessary for our integration tests.
  await bravo.setInitialProposalId();

  // re-init governance contract once delpoyed to replicate typical init process
  const api = await createApi(provider, bravo.address);

  const emitter = new EventEmitter();
  const handler = new CompoundEventHandler(emitter);

  await subscribeEvents({
    chain: 'marlin-local',
    api,
    handlers: [handler],
    // skipCatchup: true,
  });

  return {
    api,
    comp,
    timelock,
    GovernorBravo: bravo,
    addresses,
    provider,
    handler,
  };
}

async function performDelegation(
  comp: MPond,
  from: string,
  to: string,
  amount: BigNumberish
): Promise<void> {
  await comp.delegate(to, amount, { from });
}

async function createProposal(
  handler: CompoundEventHandler,
  gov: GovernorBravoImmutable,
  comp: MPond,
  from: string
): Promise<void> {
  const proposalMinimum = await gov.proposalThreshold();
  const delegateAmount = proposalMinimum.mul(3);
  await performDelegation(comp, from, from, delegateAmount);

  const targets = ['0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b'];
  const values = [BigNumber.from(0)];
  const signatures = ['_setCollateralFactor(address,uint256)'];
  const calldatas = [
    '0x000000000000000000000000C11B1268C1A384E55C48C2391D8D480264A3A7F40000000000000000000000000000000000000000000000000853A0D2313C0000',
  ];
  const description = 'test description';

  // Make the proposal.
  await gov.propose(targets, values, signatures, calldatas, description, {
    from,
  });

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

// Helper function to artificially increase time according to proposal
async function increaseTime(
  provider: providers.JsonRpcProvider,
  gov: GovernorBravoImmutable,
  from: string
) {
  // Wait for proposal to activate (by mining blocks?)
  const activeProposals = await gov.latestProposalIds(from);
  const { startBlock } = await gov.proposals(activeProposals);
  const currentBlock = await provider.getBlockNumber();
  const blockDelta = startBlock.sub(currentBlock).add(1);
  const timeDelta = blockDelta.mul(15);
  await provider.send('evm_increaseTime', [+timeDelta]);
  for (let i = 0; i < +blockDelta; ++i) {
    await provider.send('evm_mine', []);
  }
}

// Helper function that creates and then waits for a proposal to be active.
async function createActiveProposal(
  handler: CompoundEventHandler,
  governorBravo: GovernorBravoImmutable,
  comp: MPond,
  from: string,
  provider: providers.JsonRpcProvider
) {
  // Create proposal and wait for it to activate
  await createProposal(handler, governorBravo, comp, from);
  await increaseTime(provider, governorBravo, from);

  // Get the state of the proposal and make sure it is active
  const activeProposals = await governorBravo.latestProposalIds(from);
  const state = await governorBravo.state(activeProposals);
  expect(state).to.be.equal(ProposalState.Active);

  return activeProposals;
}

describe('Governor Bravo Event Integration Tests', () => {
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
    });

    it('initial address should delegate to address 2', async () => {
      const { comp, addresses } = await setupSubscription();
      await performDelegation(comp, addresses[0], addresses[2], 1000);
    });

    it('initial address should delegate to itself', async () => {
      const { comp, addresses } = await setupSubscription();
      await performDelegation(comp, addresses[0], addresses[0], 1000);
    });
  });

  describe('GovernorBravo contract function events', () => {
    it('should create a proposal', async () => {
      const { GovernorBravo, comp, addresses, handler } =
        await setupSubscription();
      await createProposal(handler, GovernorBravo, comp, addresses[0]);
    });

    it('proposal castvote against with reason', async () => {
      const { GovernorBravo, comp, addresses, handler, provider } =
        await setupSubscription();

      const from = addresses[0];

      const activeProposals = await createActiveProposal(
        handler,
        GovernorBravo,
        comp,
        from,
        provider
      );

      // VoteCast Event
      await GovernorBravo.castVoteWithReason(
        activeProposals,
        BravoSupport.Against,
        'i dont like it'
      );

      const { startBlock } = await GovernorBravo.proposals(activeProposals);
      const voteWeight = await comp.getPriorVotes(from, startBlock);

      await assertEvent(
        handler,
        EventKind.VoteCast,
        (evt: CWEvent<IVoteCast>) => {
          assert.deepEqual(evt.data, {
            kind: EventKind.VoteCast,
            id: activeProposals.toHexString(),
            voter: from,
            support: BravoSupport.Against,
            votes: voteWeight.toString(),
            reason: 'i dont like it',
          });
        }
      );
    });

    it('proposal castvote for', async () => {
      const { GovernorBravo, comp, addresses, handler, provider } =
        await setupSubscription();

      const from = addresses[0];

      const activeProposals = await createActiveProposal(
        handler,
        GovernorBravo,
        comp,
        from,
        provider
      );

      // VoteCast Event
      await GovernorBravo.castVote(activeProposals, BravoSupport.For);

      const { startBlock } = await GovernorBravo.proposals(activeProposals);
      const voteWeight = await comp.getPriorVotes(from, startBlock);

      await assertEvent(
        handler,
        EventKind.VoteCast,
        (evt: CWEvent<IVoteCast>) => {
          assert.deepEqual(evt.data, {
            kind: EventKind.VoteCast,
            id: activeProposals.toHexString(),
            voter: from,
            support: BravoSupport.For,
            votes: voteWeight.toString(),
            reason: '',
          });
        }
      );
    });

    it('proposal cancel', async () => {
      const { GovernorBravo, comp, addresses, handler, provider } =
        await setupSubscription();

      const from = addresses[0];

      const activeProposals = await createActiveProposal(
        handler,
        GovernorBravo,
        comp,
        from,
        provider
      );

      // Cancel Event
      await GovernorBravo.cancel(activeProposals);

      await assertEvent(
        handler,
        EventKind.ProposalCanceled,
        (evt: CWEvent<IProposalCanceled>) => {
          assert.deepEqual(evt.data, {
            kind: EventKind.ProposalCanceled,
            id: activeProposals.toHexString(),
          });
        }
      );
    });

    it('proposal castvote abstain', async () => {
      const { GovernorBravo, comp, addresses, handler, provider } =
        await setupSubscription();

      const from = addresses[0];

      const activeProposals = await createActiveProposal(
        handler,
        GovernorBravo,
        comp,
        from,
        provider
      );

      // VoteCast Event
      await GovernorBravo.castVote(activeProposals, BravoSupport.Abstain);

      const { startBlock } = await GovernorBravo.proposals(activeProposals);
      const voteWeight = await comp.getPriorVotes(from, startBlock);

      await assertEvent(
        handler,
        EventKind.VoteCast,
        (evt: CWEvent<IVoteCast>) => {
          assert.deepEqual(evt.data, {
            kind: EventKind.VoteCast,
            id: activeProposals.toHexString(),
            voter: from,
            support: BravoSupport.Abstain,
            votes: voteWeight.toString(),
            reason: '',
          });
        }
      );
    });

    it('proposal should succeed once voting period has expired', async () => {
      const { GovernorBravo, comp, addresses, handler, provider } =
        await setupSubscription();

      const from = addresses[0];

      let activeProposals = await createActiveProposal(
        handler,
        GovernorBravo,
        comp,
        from,
        provider
      );

      // Cast vote for
      await GovernorBravo.castVote(activeProposals, BravoSupport.For);

      // Increment time
      const votingPeriodInBlocks = +(await GovernorBravo.votingPeriod());
      await provider.send('evm_increaseTime', [votingPeriodInBlocks * 15]);
      for (let i = 0; i < votingPeriodInBlocks; i++) {
        await provider.send('evm_mine', []);
      }

      // We have voted yes, so proposal should succeed
      activeProposals = await GovernorBravo.latestProposalIds(from);
      const state = await GovernorBravo.state(activeProposals);
      expect(state).to.be.equal(ProposalState.Succeeded);
    });

    it('proposal should be defeated once voting period has expired', async () => {
      const { GovernorBravo, comp, addresses, handler, provider } =
        await setupSubscription();

      const from = addresses[0];

      let activeProposals = await createActiveProposal(
        handler,
        GovernorBravo,
        comp,
        from,
        provider
      );

      // Cast against vote
      await GovernorBravo.castVote(activeProposals, BravoSupport.Against);

      // Increment time
      const votingPeriodInBlocks = +(await GovernorBravo.votingPeriod());
      await provider.send('evm_increaseTime', [votingPeriodInBlocks * 15]);
      for (let i = 0; i < votingPeriodInBlocks; i++) {
        await provider.send('evm_mine', []);
      }

      // We have voted no, so proposal should fail
      activeProposals = await GovernorBravo.latestProposalIds(from);
      const state = await GovernorBravo.state(activeProposals);
      expect(state).to.be.equal(ProposalState.Defeated);
    });

    it('should be queued and executed', async function () {
      this.timeout(0);
      const { GovernorBravo, comp, addresses, handler, provider } =
        await setupSubscription();

      const from = addresses[0];

      let activeProposals = await createActiveProposal(
        handler,
        GovernorBravo,
        comp,
        from,
        provider
      );

      // VoteCast Event
      const { startBlock } = await GovernorBravo.proposals(activeProposals);
      const voteWeight = await comp.getPriorVotes(from, startBlock);
      await GovernorBravo.castVote(activeProposals, BravoSupport.For);
      await assertEvent(
        handler,
        EventKind.VoteCast,
        (evt: CWEvent<IVoteCast>) => {
          assert.deepEqual(evt.data, {
            kind: EventKind.VoteCast,
            id: activeProposals.toHexString(),
            voter: from,
            support: BravoSupport.For,
            votes: voteWeight.toString(),
            reason: '',
          });
        }
      );

      // Increase time until end of voting period
      const votingPeriodInBlocks = +(await GovernorBravo.votingPeriod());
      await provider.send('evm_increaseTime', [votingPeriodInBlocks * 15]);
      for (let i = 0; i < votingPeriodInBlocks; i++) {
        await provider.send('evm_mine', []);
      }

      activeProposals = await GovernorBravo.latestProposalIds(from);
      const state = await GovernorBravo.state(activeProposals);
      expect(state).to.be.equal(ProposalState.Succeeded);

      activeProposals = await GovernorBravo.latestProposalIds(from);
      await GovernorBravo.queue(activeProposals);
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

      await GovernorBravo.execute(activeProposals);
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

    it('should expire in queue', async function () {
      this.timeout(0);
      const { GovernorBravo, comp, timelock, addresses, handler, provider } =
        await setupSubscription();

      const from = addresses[0];

      let activeProposals = await createActiveProposal(
        handler,
        GovernorBravo,
        comp,
        from,
        provider
      );

      // VoteCast Event
      const { startBlock } = await GovernorBravo.proposals(activeProposals);
      const voteWeight = await comp.getPriorVotes(from, startBlock);
      await GovernorBravo.castVote(activeProposals, BravoSupport.For);
      await assertEvent(
        handler,
        EventKind.VoteCast,
        (evt: CWEvent<IVoteCast>) => {
          assert.deepEqual(evt.data, {
            kind: EventKind.VoteCast,
            id: activeProposals.toHexString(),
            voter: from,
            support: BravoSupport.For,
            votes: voteWeight.toString(),
            reason: '',
          });
        }
      );

      // Increase time until end of voting period
      const votingPeriodInBlocks = +(await GovernorBravo.votingPeriod());
      await provider.send('evm_increaseTime', [votingPeriodInBlocks * 15]);
      for (let i = 0; i < votingPeriodInBlocks; i++) {
        await provider.send('evm_mine', []);
      }

      activeProposals = await GovernorBravo.latestProposalIds(from);
      let state = await GovernorBravo.state(activeProposals);
      expect(state).to.be.equal(ProposalState.Succeeded);

      activeProposals = await GovernorBravo.latestProposalIds(from);
      await GovernorBravo.queue(activeProposals);
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

      // advance beyond grace period so it expires despite successful votes
      activeProposals = await GovernorBravo.latestProposalIds(addresses[0]);
      const gracePeriod = await timelock.GRACE_PERIOD();
      const proposal = await GovernorBravo.proposals(activeProposals);
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
      state = await GovernorBravo.state(activeProposals);
      expect(state).to.be.equal(ProposalState.Expired);
    });

    it('should fetch proposals from storage', async function () {
      this.timeout(0);
      const { GovernorBravo, comp, addresses, handler, provider, api } =
        await setupSubscription();

      const from = addresses[0];
      const beginBlock = await provider.getBlockNumber();

      let activeProposals = await createActiveProposal(
        handler,
        GovernorBravo,
        comp,
        from,
        provider
      );

      await GovernorBravo.castVote(activeProposals, BravoSupport.For);

      // Increase time until end of voting period
      const votingPeriodInBlocks = +(await GovernorBravo.votingPeriod());
      await provider.send('evm_increaseTime', [votingPeriodInBlocks * 15]);
      for (let i = 0; i < votingPeriodInBlocks; i++) {
        await provider.send('evm_mine', []);
      }

      activeProposals = await GovernorBravo.latestProposalIds(from);
      const state = await GovernorBravo.state(activeProposals);
      expect(state).to.be.equal(ProposalState.Succeeded);

      activeProposals = await GovernorBravo.latestProposalIds(from);
      await GovernorBravo.queue(activeProposals);
      const p = await GovernorBravo.proposals(activeProposals);
      const eta = +p.eta;
      await GovernorBravo.execute(activeProposals);

      // TODO: compute block numbers rather than manually
      const eventData: CWEvent<IEventData>[] = [
        {
          blockNumber: beginBlock + 2,
          data: {
            calldatas: [
              '0x000000000000000000000000c11b1268c1a384e55c48c2391d8d480264a3a7f40000000000000000000000000000000000000000000000000853a0d2313c0000',
            ],
            description: 'test description',
            endBlock: beginBlock + 13,
            id: '0x02',
            kind: EventKind.ProposalCreated,
            proposer: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
            signatures: ['_setCollateralFactor(address,uint256)'],
            startBlock: beginBlock + 3,
            targets: ['0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B'],
            values: ['0'],
          },
          excludeAddresses: ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'],
          network: SupportedNetwork.Compound,
        },
        {
          blockNumber: beginBlock + 5,
          data: {
            id: '0x02',
            kind: EventKind.VoteCast,
            reason: '',
            support: 1,
            voter: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
            votes: '3',
          },
          excludeAddresses: ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'],
          network: SupportedNetwork.Compound,
        },
        {
          blockNumber: beginBlock + 16,
          data: {
            id: '0x02',
            kind: EventKind.ProposalQueued,
            eta,
          },
          excludeAddresses: [],
          network: SupportedNetwork.Compound,
        },
        {
          blockNumber: beginBlock + 17,
          data: {
            id: '0x02',
            kind: EventKind.ProposalExecuted,
          },
          excludeAddresses: [],
          network: SupportedNetwork.Compound,
        },
      ];

      // fetch all non-complete from storage (none)
      const fetcher = new StorageFetcher(api);

      // fetch all from storage
      const allData = await fetcher.fetch();
      assert.deepEqual(allData, eventData);
    });
  });
});
