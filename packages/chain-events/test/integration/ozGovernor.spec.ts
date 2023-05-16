/* eslint-disable func-names */
import '@nomiclabs/hardhat-ethers';
import { EventEmitter } from 'events';

import chai, { expect } from 'chai';
import { ethers } from 'hardhat';
import { BigNumber, utils } from 'ethers';
import type { Signer, providers, BigNumberish } from 'ethers';

import type {
  GovernorMock,
  ERC20VotesMock,
  TimelockController,
} from '../../src/contractTypes';
import {
  GovernorMock__factory as GovernorMockFactory,
  ERC20VotesMock__factory as ERC20VotesMockFactory,
  TimelockController__factory as TimelockControllerFactory,
} from '../../src/contractTypes';
import type {
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
import { subscribeEvents } from '../../src/chain-bases/EVM/compound';
import type { CWEvent, IChainEventData } from '../../src';
import { IEventHandler } from '../../src';

const { assert } = chai;

async function deployErc20VotesMock(
  signer: Signer | providers.JsonRpcSigner,
  account: string,
  amount: number
): Promise<ERC20VotesMock> {
  const factory = new ERC20VotesMockFactory(signer);
  const t = await factory.deploy('Test Token', 'TEST');
  await t.mint(account, amount);
  return t;
}

async function deployTimelock(
  signer: Signer | providers.JsonRpcSigner,
  minDelay: BigNumberish,
  proposers: string[],
  executors: string[]
): Promise<TimelockController> {
  const factory = new TimelockControllerFactory(signer);
  return factory.deploy(minDelay, proposers, executors);
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
  event: EventKind
): Promise<CWEvent<T>> {
  return new Promise<CWEvent<T>>((resolve) => {
    handler.emitter.on(event, (evt: CWEvent<T>) => resolve(evt));
  });
}

interface ISetupData {
  api: GovernorMock;
  token: ERC20VotesMock;
  addresses: string[];
  provider: providers.JsonRpcProvider;
  handler: CompoundEventHandler;
}

async function setupSubscription(): Promise<ISetupData> {
  // eslint-disable-next-line prefer-destructuring
  const provider = ethers.provider;
  const addresses: string[] = await provider.listAccounts();
  const [member] = addresses;
  const signer = provider.getSigner(member);

  // deploy voting token and mint 100 tokens
  const token = await deployErc20VotesMock(signer, member, 100);

  // deploy timelock
  const timelock = await deployTimelock(signer, 2 * 60, [member], [member]); // 2 min minutes delay

  // deploy governor
  const factory = new GovernorMockFactory(signer);
  const governor = await factory.deploy(
    'Test Governor',
    token.address,
    2, // 2 blocks delay until vote starts
    16, // vote goes for 16 blocks
    timelock.address,
    5, // 5% of token supply must vote to pass = 5 tokens,
    0 // 0 votes required for a voter to become a proposer
  );

  // ensure governor can make calls on timelock by granting roles
  const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
  const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
  await timelock.grantRole(PROPOSER_ROLE, governor.address);
  await timelock.grantRole(EXECUTOR_ROLE, governor.address);

  const handler = new CompoundEventHandler(new EventEmitter());

  await subscribeEvents({
    chain: 'marlin-local',
    api: governor as any,
    handlers: [handler],
    // skipCatchup: true,
  });

  return {
    api: governor,
    token,
    addresses,
    provider,
    handler,
  };
}

async function performDelegation(
  comp: ERC20VotesMock,
  from: string,
  to: string
): Promise<void> {
  await comp.delegate(to, { from });
}

async function createProposal(
  handler: CompoundEventHandler,
  gov: GovernorMock,
  comp: ERC20VotesMock,
  from: string
): Promise<CWEvent<IProposalCreated>> {
  await performDelegation(comp, from, from);

  const targets = ['0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b'];
  const values = [BigNumber.from(0)];
  const calldatas = ['0x853A0D2313C000'];
  const description = 'test description';

  // Make the proposal.
  await gov.propose(targets, values, calldatas, description, {
    from,
  });

  const evt: CWEvent<IProposalCreated> = await assertEvent(
    handler,
    EventKind.ProposalCreated
  );
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
  return evt;
}

// Helper function to artificially increase time according to proposal
async function increaseTime(
  provider: providers.JsonRpcProvider,
  nBlocks: number
) {
  const timeDelta = nBlocks * 15;
  await provider.send('evm_increaseTime', [+timeDelta]);
  for (let i = 0; i < nBlocks; ++i) {
    await provider.send('evm_mine', []);
  }
}

// Helper function that creates and then waits for a proposal to be active.
async function createActiveProposal(
  handler: CompoundEventHandler,
  api: GovernorMock,
  token: ERC20VotesMock,
  from: string,
  provider: providers.JsonRpcProvider
): Promise<CWEvent<IProposalCreated>> {
  // Create proposal and wait for it to activate
  const p = await createProposal(handler, api, token, from);
  await increaseTime(provider, 3);

  // Get the state of the proposal and make sure it is active
  const state = await api.state(p.data.id);
  expect(state).to.be.equal(ProposalState.Active);

  return p;
}

describe('OpenZeppelin Governance Event Integration Tests', () => {
  describe('OpenZeppelin Governance contract function events', () => {
    it('should create a proposal', async () => {
      const { api, token, addresses, handler } = await setupSubscription();
      const p = await createProposal(handler, api, token, addresses[0]);
      const idHex = BigNumber.from(p.data.id).toHexString();

      // ensure hash comes out okay
      const descriptionHash = utils.keccak256(
        utils.toUtf8Bytes(p.data.description)
      );
      const coder = new utils.AbiCoder();
      const data = coder.encode(
        ['address[]', 'uint256[]', 'bytes[]', 'bytes32'],
        [p.data.targets, p.data.values, p.data.calldatas, descriptionHash]
      );
      const hashedData = utils.keccak256(data);
      const hashedProposal = (
        await api.hashProposal(
          p.data.targets,
          p.data.values,
          p.data.calldatas,
          descriptionHash
        )
      ).toHexString();

      // compare contract-computed results with stored id
      assert.deepEqual(hashedProposal.toLowerCase(), idHex.toLowerCase());

      // compare stored id with locally computed results
      assert.deepEqual(idHex.toLowerCase(), hashedData.toLowerCase());
    });

    it('proposal castvote against with reason', async () => {
      const { api, token, addresses, handler, provider } =
        await setupSubscription();
      const from = addresses[0];
      const p = await createActiveProposal(handler, api, token, from, provider);

      // VoteCast Event
      await api.castVoteWithReason(
        p.data.id,
        BravoSupport.Against,
        'i dont like it'
      );

      const evt: CWEvent<IVoteCast> = await assertEvent(
        handler,
        EventKind.VoteCast
      );

      const voteWeight = await api.getVotes(from, p.data.startBlock);
      assert.deepEqual(evt.data, {
        kind: EventKind.VoteCast,
        id: p.data.id,
        voter: from,
        support: BravoSupport.Against,
        votes: voteWeight.toString(),
        reason: 'i dont like it',
      });
    });

    it('proposal castvote for', async () => {
      const { api, token, addresses, handler, provider } =
        await setupSubscription();
      const from = addresses[0];
      const p = await createActiveProposal(handler, api, token, from, provider);

      // VoteCast Event
      await api.castVote(p.data.id, BravoSupport.For, { from });

      const evt: CWEvent<IVoteCast> = await assertEvent(
        handler,
        EventKind.VoteCast
      );

      const voteWeight = await api.getVotes(from, p.data.startBlock);
      assert.deepEqual(evt.data, {
        kind: EventKind.VoteCast,
        id: p.data.id,
        voter: from,
        support: BravoSupport.For,
        votes: voteWeight.toString(),
        reason: '',
      });
    });

    it('proposal cancel', async () => {
      const { api, token, addresses, handler, provider } =
        await setupSubscription();
      const from = addresses[0];
      const p = await createActiveProposal(handler, api, token, from, provider);

      // Cancel Event
      const descriptionHash = utils.keccak256(
        utils.toUtf8Bytes(p.data.description)
      );
      await api.cancel(
        p.data.targets,
        p.data.values,
        p.data.calldatas,
        descriptionHash
      );

      const evt: CWEvent<IProposalCanceled> = await assertEvent(
        handler,
        EventKind.ProposalCanceled
      );
      assert.deepEqual(evt.data, {
        kind: EventKind.ProposalCanceled,
        id: p.data.id,
      });
    });

    it('proposal castvote abstain', async () => {
      const { api, token, addresses, handler, provider } =
        await setupSubscription();
      const from = addresses[0];
      const p = await createActiveProposal(handler, api, token, from, provider);

      // VoteCast Event
      await api.castVote(p.data.id, BravoSupport.Abstain);

      const evt: CWEvent<IVoteCast> = await assertEvent(
        handler,
        EventKind.VoteCast
      );

      const voteWeight = await api.getVotes(from, p.data.startBlock);
      assert.deepEqual(evt.data, {
        kind: EventKind.VoteCast,
        id: p.data.id,
        voter: from,
        support: BravoSupport.Abstain,
        votes: voteWeight.toString(),
        reason: '',
      });
    });

    it('proposal should succeed once voting period has expired', async () => {
      const { api, token, addresses, handler, provider } =
        await setupSubscription();
      const from = addresses[0];
      const p = await createActiveProposal(handler, api, token, from, provider);

      // VoteCast Event
      await api.castVote(p.data.id, BravoSupport.For, { from });

      // Increment time
      const votingPeriodInBlocks = +(await api.votingPeriod());
      await provider.send('evm_increaseTime', [votingPeriodInBlocks * 15]);
      for (let i = 0; i < votingPeriodInBlocks; i++) {
        await provider.send('evm_mine', []);
      }

      // We have voted yes, so proposal should succeed
      const state = await api.state(p.data.id);
      expect(state).to.be.equal(ProposalState.Succeeded);
    });

    it('proposal should be defeated once voting period has expired', async () => {
      const { api, token, addresses, handler, provider } =
        await setupSubscription();
      const from = addresses[0];
      const p = await createActiveProposal(handler, api, token, from, provider);

      // VoteCast Event
      await api.castVote(p.data.id, BravoSupport.Against, { from });

      // Increment time
      const votingPeriodInBlocks = +(await api.votingPeriod());
      await provider.send('evm_increaseTime', [votingPeriodInBlocks * 15]);
      for (let i = 0; i < votingPeriodInBlocks; i++) {
        await provider.send('evm_mine', []);
      }

      // We have voted yes, so proposal should succeed
      const state = await api.state(p.data.id);
      expect(state).to.be.equal(ProposalState.Defeated);
    });

    it('should be queued and executed', async function () {
      const { api, token, addresses, handler, provider } =
        await setupSubscription();
      const from = addresses[0];
      const p = await createActiveProposal(handler, api, token, from, provider);

      // VoteCast Event
      await api.castVote(p.data.id, BravoSupport.For, { from });

      // Increment time
      const votingPeriodInBlocks = +(await api.votingPeriod());
      await provider.send('evm_increaseTime', [votingPeriodInBlocks * 15]);
      for (let i = 0; i < votingPeriodInBlocks; i++) {
        await provider.send('evm_mine', []);
      }

      // We have voted yes, so proposal should succeed
      let state = await api.state(p.data.id);
      expect(state).to.be.equal(ProposalState.Succeeded);

      // queue the proposal
      const descriptionHash = utils.keccak256(
        utils.toUtf8Bytes(p.data.description)
      );
      await api.queue(
        p.data.targets,
        p.data.values,
        p.data.calldatas,
        descriptionHash
      );
      const qEvt: CWEvent<IProposalQueued> = await assertEvent(
        handler,
        EventKind.ProposalQueued
      );
      assert.deepEqual(
        {
          kind: qEvt.data.kind,
          id: qEvt.data.id,
        },
        {
          kind: EventKind.ProposalQueued,
          id: p.data.id,
        }
      );

      state = await api.state(p.data.id);
      expect(state).to.be.equal(ProposalState.Queued);

      // wait 2min
      const timeToAdvance = 120;
      await provider.send('evm_increaseTime', [timeToAdvance]);
      for (let i = 0; i < Math.ceil(timeToAdvance / 15); i++) {
        await provider.send('evm_mine', []);
      }

      // perform execute
      await api.execute(
        p.data.targets,
        p.data.values,
        p.data.calldatas,
        descriptionHash
      );

      const evt: CWEvent<IProposalExecuted> = await assertEvent(
        handler,
        EventKind.ProposalExecuted
      );

      const { kind, id } = evt.data;
      assert.deepEqual(
        {
          kind,
          id,
        },
        {
          kind: EventKind.ProposalExecuted,
          id: p.data.id,
        }
      );
    });
  });
});
