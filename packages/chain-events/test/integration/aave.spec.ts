/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
/* eslint-disable no-unused-expressions */
import { EventEmitter } from 'events';

import type { BigNumber } from 'ethers';
import { providers, utils } from 'ethers';
import { assert } from 'chai';

import type {
  AaveTokenV2Mock as AaveTokenV2,
  GovernanceStrategy,
  Executor,
} from '../../src/contractTypes';
import {
  AaveTokenV2Mock__factory as AaveTokenV2Factory,
  GovernanceStrategy__factory as GovernanceStrategyFactory,
  Executor__factory as ExecutorFactory,
  AaveGovernanceV2__factory as AaveGovernanceV2Factory,
} from '../../src/contractTypes';
import type {
  Api,
  IEventData,
  IProposalCreated,
  IProposalCanceled,
  IVoteEmitted,
  IProposalQueued,
  IProposalExecuted,
  IDelegateChanged,
  IDelegatedPowerChanged,
  ITransfer,
} from 'chain-events/src/chain-bases/EVM/aave/types';
import {
  EventKind,
  ProposalState,
} from 'chain-events/src/chain-bases/EVM/aave/types';
import { subscribeEvents } from 'chain-events/src/chain-bases/EVM/aave/subscribeFunc';
import type { CWEvent, IChainEventData } from '../../src/interfaces';
import { IEventHandler, SupportedNetwork } from '../../src/interfaces';
import { StorageFetcher } from 'chain-events/src/chain-bases/EVM/aave/storageFetcher';

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

class AaveEventHandler extends IEventHandler {
  constructor(public readonly emitter: EventEmitter) {
    super();
  }

  public async handle(event: CWEvent<IEventData>): Promise<IChainEventData> {
    this.emitter.emit(event.data.kind.toString(), event);
    return null;
  }
}

function assertEvent<T extends IEventData>(
  handler: AaveEventHandler,
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
  executor: Executor;
  strategy: GovernanceStrategy;
  addresses: string[];
  provider: providers.Web3Provider;
  handler: AaveEventHandler;
}

async function increaseTime(
  blocks: number,
  provider: providers.Web3Provider
): Promise<void> {
  const timeToAdvance = blocks * 15;
  console.log(`Mining ${blocks} blocks and adding ${timeToAdvance} seconds!`);
  await provider.send('evm_increaseTime', [timeToAdvance]);
  for (let i = 0; i < blocks; i++) {
    await provider.send('evm_mine', []);
  }
}

async function initToken(
  handler: AaveEventHandler,
  token: AaveTokenV2,
  member: string,
  amount: string
): Promise<void> {
  await token.mint(member, amount);
  await token.delegate(member);
  await Promise.all([
    assertEvent(handler, EventKind.Transfer, (evt: CWEvent<ITransfer>) => {
      assert.deepEqual(evt.data, {
        kind: EventKind.Transfer,
        tokenAddress: token.address,
        from: '0x0000000000000000000000000000000000000000',
        to: member,
        amount,
      });
    }),
    assertEvent(
      handler,
      EventKind.DelegateChanged,
      (evt: CWEvent<IDelegateChanged>) => {
        // should emit for both types
        assert.deepEqual(
          {
            tokenAddress: evt.data.tokenAddress,
            delegatee: evt.data.delegatee,
            delegator: evt.data.delegator,
          },
          {
            tokenAddress: token.address,
            delegatee: member,
            delegator: member,
          }
        );
      }
    ),
    assertEvent(
      handler,
      EventKind.DelegatedPowerChanged,
      (evt: CWEvent<IDelegatedPowerChanged>) => {
        // should emit for both types
        assert.deepEqual(
          {
            tokenAddress: evt.data.tokenAddress,
            who: evt.data.who,
            amount: evt.data.amount,
          },
          {
            tokenAddress: token.address,
            who: member,
            amount,
          }
        );
      }
    ),
  ]);
}

async function setupSubscription(subscribe = true): Promise<ISetupData> {
  const provider = getProvider();
  const addresses: string[] = await provider.listAccounts();
  const [member] = addresses;
  const signer = provider.getSigner(member);
  const TOTAL_SUPPLY = '1000000';

  // deploy and delegate tokens
  const tokenFactory = new AaveTokenV2Factory(signer);
  const token1 = await tokenFactory.deploy();
  const token2 = await tokenFactory.deploy();

  // deploy strategy
  const strategyFactory = new GovernanceStrategyFactory(signer);
  const strategy = await strategyFactory.deploy(token1.address, token2.address);

  // deploy AaveGovernance without executor, so we can pass as admin to executor constructor
  const govFactory = new AaveGovernanceV2Factory(signer);
  const governance = await govFactory.deploy(
    strategy.address,
    4, // 4 block voting delay
    member,
    []
  );

  // deploy Executor
  const executorFactory = new ExecutorFactory(signer);
  const executor = await executorFactory.deploy(
    governance.address,
    60, // 1min delay
    60, // 1min grace period
    15, // 15s minimum delay
    120, // 2min maximum delay
    10, // 10% of supply required to submit
    12, // 12 blocks voting period
    10, // 10% differential required to pass
    20 // 20% quorum
  );

  // authorize executor on governance contract
  await governance.authorizeExecutors([executor.address]);

  const api: Api = {
    governance,
    aaveToken: token1,
    stkAaveToken: token2,
  };

  const emitter = new EventEmitter();
  const handler = new AaveEventHandler(emitter);
  if (subscribe) {
    await subscribeEvents({
      chain: 'aave-local',
      api,
      handlers: [handler],
      // skipCatchup: true,
    });
  }

  // initialize tokens and test delegate events
  await initToken(handler, token1, member, TOTAL_SUPPLY);
  await initToken(handler, token2, member, TOTAL_SUPPLY);
  await increaseTime(1, provider);
  return { api, executor, strategy, addresses, provider, handler };
}

async function createProposal({
  api,
  executor,
  addresses,
  provider,
  handler,
}: ISetupData): Promise<number> {
  const targets = ['0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B'];
  const values = ['0'];
  const signatures = ['_setCollateralFactor(address,uint256)'];
  const calldatas = [
    '0x000000000000000000000000c11b1268c1a384e55c48c2391d8d480264a3a7f40000000000000000000000000000000000000000000000000853a0d2313c0000',
  ];
  const withDelegateCalls = [false];
  const ipfsHash = utils.formatBytes32String('0x123abc');
  const strategy = await api.governance.getGovernanceStrategy();
  const blockNumber = await provider.getBlockNumber();
  const id = await api.governance.getProposalsCount();
  await api.governance.create(
    executor.address,
    targets,
    values,
    signatures,
    calldatas,
    withDelegateCalls,
    ipfsHash
  );
  await assertEvent(
    handler,
    EventKind.ProposalCreated,
    (evt: CWEvent<IProposalCreated>) => {
      assert.deepEqual(evt.data, {
        kind: EventKind.ProposalCreated,
        id: +id,
        proposer: addresses[0],
        executor: executor.address,
        targets,
        values,
        signatures,
        calldatas,
        startBlock: blockNumber + 1 + 4, // voting delay
        endBlock: blockNumber + 1 + 4 + 12, // voting delay + voting duration
        strategy,
        ipfsHash,
      });
    }
  );
  const state = await api.governance.getProposalState(id);
  assert.equal(state, ProposalState.PENDING);
  return +id;
}

async function createAndCancel(setupData: ISetupData): Promise<number> {
  const id = await createProposal(setupData);
  await setupData.api.governance.cancel(id);
  await assertEvent(
    setupData.handler,
    EventKind.ProposalCanceled,
    (evt: CWEvent<IProposalCanceled>) => {
      assert.deepEqual(evt.data, {
        kind: EventKind.ProposalCanceled,
        id,
      });
    }
  );
  return id;
}

async function createAndVote({
  api,
  executor,
  addresses,
  strategy,
  provider,
  handler,
}: ISetupData): Promise<{
  id: number;
  votingBlock: number;
  votingPower: BigNumber;
}> {
  const id = await createProposal({
    api,
    executor,
    addresses,
    strategy,
    provider,
    handler,
  });

  // advance time to proposal start
  const { startBlock } = await api.governance.getProposalById(id);
  const currentBlock = await provider.getBlockNumber();
  const blocksToAdvance = +startBlock - currentBlock + 1;
  await increaseTime(blocksToAdvance, provider);

  const votingBlock = await provider.getBlockNumber();
  const state = await api.governance.getProposalState(id);
  assert.equal(state, ProposalState.ACTIVE);

  // emit vote
  const votingPower = await strategy.getVotingPowerAt(
    addresses[0],
    votingBlock
  );
  await api.governance.submitVote(id, true);
  await assertEvent(
    handler,
    EventKind.VoteEmitted,
    (evt: CWEvent<IVoteEmitted>) => {
      assert.deepEqual(evt.data, {
        kind: EventKind.VoteEmitted,
        id,
        voter: addresses[0],
        support: true,
        votingPower: votingPower.toString(),
      });
    }
  );
  return { id, votingBlock, votingPower };
}

async function proposeToCompletion(
  setupData: ISetupData
): Promise<{ id: number; votingBlock: number; votingPower: BigNumber }> {
  const { id, votingBlock, votingPower } = await createAndVote(setupData);

  // wait for voting to succeed
  const { api, provider, executor } = setupData;
  const { endBlock } = await api.governance.getProposalById(id);
  const currentBlock = await provider.getBlockNumber();
  const blocksToAdvance = +endBlock - currentBlock + 1;
  await increaseTime(blocksToAdvance, provider);

  const state = await api.governance.getProposalState(id);
  assert.equal(state, ProposalState.SUCCEEDED);

  // queue proposal
  const delay = await executor.getDelay();
  await api.governance.queue(id);
  const queueBlock = await provider.getBlockNumber();
  const { timestamp } = await provider.getBlock(queueBlock);
  const executionTime = timestamp + +delay;
  await assertEvent(
    setupData.handler,
    EventKind.ProposalQueued,
    (evt: CWEvent<IProposalQueued>) => {
      assert.deepEqual(evt.data, {
        kind: EventKind.ProposalQueued,
        id,
        executionTime,
      });
    }
  );
  const queuedState = await api.governance.getProposalState(id);
  assert.equal(queuedState, ProposalState.QUEUED);

  // wait for execution
  const delayBlocks = Math.ceil(+delay / 15) + 1;
  await increaseTime(delayBlocks, provider);
  await api.governance.execute(id);
  await assertEvent(
    setupData.handler,
    EventKind.ProposalExecuted,
    (evt: CWEvent<IProposalExecuted>) => {
      assert.deepEqual(evt.data, {
        kind: EventKind.ProposalExecuted,
        id,
      });
    }
  );
  return { id, votingBlock, votingPower };
}

describe('Aave Event Integration Tests', () => {
  it('should create a proposal', async () => {
    const setupData = await setupSubscription();
    await createProposal(setupData);
  });

  it('should cancel a proposal', async () => {
    const setupData = await setupSubscription();
    await createAndCancel(setupData);
  });

  it('should vote on a proposal', async () => {
    const setupData = await setupSubscription();
    await createAndVote(setupData);
  });

  it('should queue and execute a proposal', async () => {
    const setupData = await setupSubscription();
    await proposeToCompletion(setupData);
  });

  it('should fetch proposals from storage', async () => {
    const setupData = await setupSubscription();
    const { api, strategy, executor, addresses } = setupData;

    const targets = ['0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B'];
    const values = ['0'];
    const signatures = ['_setCollateralFactor(address,uint256)'];
    const calldatas = [
      '0x000000000000000000000000c11b1268c1a384e55c48c2391d8d480264a3a7f40000000000000000000000000000000000000000000000000853a0d2313c0000',
    ];
    const ipfsHash = utils.formatBytes32String('0x123abc');

    // cancel first proposal
    const cancelledId = await createAndCancel(setupData);
    const cancelledProposal = await api.governance.getProposalById(cancelledId);

    // complete second proposal
    const {
      id: completedId,
      votingBlock,
      votingPower,
    } = await proposeToCompletion(setupData);
    const completedProposal = await api.governance.getProposalById(completedId);

    // TODO: compute block numbers rather than manually
    const eventData: CWEvent<IEventData>[] = [
      {
        blockNumber: 12,
        excludeAddresses: [addresses[0]],
        network: SupportedNetwork.Aave,
        data: {
          kind: EventKind.ProposalCreated,
          id: cancelledId,
          proposer: addresses[0],
          executor: executor.address,
          targets,
          values,
          signatures,
          calldatas,
          startBlock: +cancelledProposal.startBlock,
          endBlock: +cancelledProposal.endBlock,
          strategy: strategy.address,
          ipfsHash,
        },
      },
      {
        blockNumber: 13,
        excludeAddresses: [],
        network: SupportedNetwork.Aave,
        data: {
          kind: EventKind.ProposalCanceled,
          id: cancelledId,
        },
      },
      {
        blockNumber: 14,
        excludeAddresses: [addresses[0]],
        network: SupportedNetwork.Aave,
        data: {
          kind: EventKind.ProposalCreated,
          id: completedId,
          proposer: addresses[0],
          executor: executor.address,
          targets,
          values,
          signatures,
          calldatas,
          startBlock: +completedProposal.startBlock,
          endBlock: +completedProposal.endBlock,
          strategy: strategy.address,
          ipfsHash,
        },
      },
      {
        blockNumber: votingBlock + 1,
        excludeAddresses: [addresses[0]],
        network: SupportedNetwork.Aave,
        data: {
          kind: EventKind.VoteEmitted,
          id: completedId,
          support: true,
          voter: addresses[0],
          votingPower: votingPower.toString(),
        },
      },
      {
        blockNumber: 32,
        excludeAddresses: [],
        network: SupportedNetwork.Aave,
        data: {
          kind: EventKind.ProposalQueued,
          id: completedId,
          executionTime: +completedProposal.executionTime,
        },
      },
      {
        blockNumber: 38,
        excludeAddresses: [],
        network: SupportedNetwork.Aave,
        data: {
          kind: EventKind.ProposalExecuted,
          id: completedId,
        },
      },
    ];

    // fetch all non-complete from storage (none)
    const fetcher = new StorageFetcher(api);

    // fetch all from storage
    const allData = await fetcher.fetch();
    assert.deepEqual(allData, eventData);

    // fetch some from storage
    const completedData = await fetcher.fetch({
      startBlock: 17,
    });
    assert.deepEqual(completedData, eventData.slice(3));
  });
});
