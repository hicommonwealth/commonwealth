/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
import { EventEmitter } from 'events';

import { providers } from 'ethers';
import chai from 'chai';

import {
  Moloch1__factory as Moloch1Factory,
  Moloch1,
  Token__factory as TokenFactory,
  Token,
} from '../../src/contractTypes';
import {
  Api,
  IEventData,
  EventKind,
  ISubmitProposal,
  IProcessProposal,
  IAbort,
} from '../../src/chains/moloch/types';
import { subscribeEvents } from '../../src/chains/moloch/subscribeFunc';
import {
  IEventHandler,
  CWEvent,
  IDisconnectedRange,
  IChainEventData,
} from '../../src/interfaces';

const { assert } = chai;

function getProvider(): providers.Web3Provider {
  const web3Provider = require('ganache-cli').provider({
    allowUnlimitedContractSize: true,
    gasLimit: 1000000000,
    time: new Date(1000),
    // logger: console,
  });
  return new providers.Web3Provider(web3Provider);
}

async function deployToken(signer): Promise<Token> {
  const factory = new TokenFactory(signer);
  const token = await factory.deploy(100);
  return token;
}

async function deployMoloch1(signer, summoner, tokenAddress): Promise<Moloch1> {
  const factory = new Moloch1Factory(signer);
  const moloch1 = await factory.deploy(
    summoner,
    tokenAddress,
    2, // _periodDuration: 2 second
    2, // _votingPeriodLength: 4 seconds
    2, // _gracePeriodLength: 4 seconds
    2, // _abortWindow: 2 seconds
    5, // _proposalDeposit
    100, // _diluationBound
    5 // _processingReward
  );
  return moloch1;
}

class MolochEventHandler extends IEventHandler<IChainEventData> {
  constructor(public readonly emitter: EventEmitter) {
    super();
  }

  public async handle(event: CWEvent<IEventData>): Promise<IChainEventData> {
    this.emitter.emit(event.data.kind.toString(), event);
    this.emitter.emit('*', event);
    return null;
  }
}

interface ISetupData {
  api: Api;
  token: Token;
  addresses: string[];
  provider: providers.Web3Provider;
  handler: MolochEventHandler;
}

async function setupSubscription(subscribe = true): Promise<ISetupData> {
  const provider = getProvider();
  const addresses: string[] = await provider.listAccounts();
  const [member] = addresses;
  const signer = provider.getSigner(member);
  const token = await deployToken(signer);
  const api: Api = await deployMoloch1(signer, member, token.address);
  const emitter = new EventEmitter();
  const handler = new MolochEventHandler(emitter);
  if (subscribe) {
    await subscribeEvents({
      chain: 'test',
      api,
      contractVersion: 1,
      handlers: [handler],
      skipCatchup: true,
    });
  }
  return { api, token, addresses, provider, handler };
}

async function submitProposal(
  provider: providers.Web3Provider,
  api: Api,
  token: Token,
  member: string,
  applicant: string,
  mineBlocks = false
): Promise<void> {
  if (mineBlocks) provider.send('evm_increaseTime', [2]);
  await token.transfer(applicant, 10);
  if (mineBlocks) provider.send('evm_increaseTime', [2]);
  await token.approve(api.address, 5);

  const appSigner = provider.getSigner(applicant);
  const appToken = TokenFactory.connect(token.address, appSigner);
  if (mineBlocks) provider.send('evm_increaseTime', [2]);
  await appToken.deployed();
  if (mineBlocks) provider.send('evm_increaseTime', [2]);
  await appToken.approve(api.address, 5);

  const summonerBalance = await token.balanceOf(member);
  const applicantBalance = await token.balanceOf(applicant);
  const summonerAllowance = await token.allowance(member, api.address);
  const applicantAllowance = await token.allowance(applicant, api.address);
  assert.isAtLeast(+summonerBalance, 5);
  assert.isAtLeast(+applicantBalance, 5);
  assert.isAtLeast(+summonerAllowance, 5);
  assert.isAtLeast(+applicantAllowance, 5);

  if (mineBlocks) provider.send('evm_increaseTime', [2]);
  await (api as Moloch1).submitProposal(applicant, 5, 5, 'hello');
}

describe('Moloch Event Integration Tests', () => {
  it('should summon moloch1', async () => {
    const { addresses, handler } = await setupSubscription();
    await new Promise<void>((resolve) => {
      handler.emitter.on(
        EventKind.SummonComplete.toString(),
        (evt: CWEvent<IEventData>) => {
          assert.deepEqual(evt.data, {
            kind: EventKind.SummonComplete,
            summoner: addresses[0],
            shares: '1',
          });
          resolve();
        }
      );
    });
  });

  it('should create moloch1 proposal', async () => {
    const {
      addresses,
      handler,
      api,
      token,
      provider,
    } = await setupSubscription();
    const [member, applicant] = addresses;
    const summonTime = await api.summoningTime();
    await submitProposal(provider, api, token, member, applicant);
    await new Promise<void>((resolve) => {
      handler.emitter.on(
        EventKind.SubmitProposal.toString(),
        (evt: CWEvent<IEventData>) => {
          assert.deepEqual(evt.data, {
            kind: EventKind.SubmitProposal,
            proposalIndex: 0,
            member,
            delegateKey: member,
            applicant,
            tokenTribute: '5',
            sharesRequested: '5',
            details: 'hello',
            startTime: +summonTime + 2,
          });
          resolve();
        }
      );
    });
  });

  it('should create moloch1 vote', async () => {
    const {
      addresses,
      handler,
      api,
      token,
      provider,
    } = await setupSubscription();
    const [member, applicant] = addresses;
    await submitProposal(provider, api, token, member, applicant);

    // wait 2 seconds to enter voting period
    provider.send('evm_increaseTime', [2]);
    await api.submitVote(0, 2);
    await new Promise<void>((resolve) => {
      handler.emitter.on(
        EventKind.SubmitVote.toString(),
        (evt: CWEvent<IEventData>) => {
          assert.deepEqual(evt.data, {
            kind: EventKind.SubmitVote,
            proposalIndex: 0,
            member,
            delegateKey: member,
            vote: 2,
            shares: '1',
            highestIndexYesVote: 0,
          });
          resolve();
        }
      );
    });
  });

  it('should process moloch1 proposal', async () => {
    const {
      addresses,
      handler,
      api,
      token,
      provider,
    } = await setupSubscription();
    const [member, applicant] = addresses;
    await submitProposal(provider, api, token, member, applicant);

    // wait 2 seconds to enter voting period
    provider.send('evm_increaseTime', [2]);
    await api.submitVote(0, 1);

    // wait another 10 seconds to finish voting/grace periods
    provider.send('evm_increaseTime', [10]);

    const proposalPreprocess = await (api as Moloch1).proposalQueue(0);
    assert.equal(proposalPreprocess.processed, false);
    assert.equal(proposalPreprocess.didPass, false);

    await api.processProposal(0);
    await new Promise<void>((resolve) => {
      handler.emitter.on(
        EventKind.ProcessProposal.toString(),
        (evt: CWEvent<IEventData>) => {
          assert.deepEqual(evt.data, {
            kind: EventKind.ProcessProposal,
            proposalIndex: 0,
            member,
            applicant,
            tokenTribute: '5',
            sharesRequested: '5',
            didPass: true,
            yesVotes: '1',
            noVotes: '0',
          });
          resolve();
        }
      );
    });

    // verify contract storage
    const proposal = await (api as Moloch1).proposalQueue(0);
    assert.equal(proposal.processed, true);
    assert.equal(proposal.didPass, true);
    assert.equal(+proposal.yesVotes, 1);
    assert.equal(+proposal.noVotes, 0);

    const applicantMember = await api.members(applicant);
    assert.equal(applicantMember.exists, true);
    assert.equal(+applicantMember.shares, 5);
    assert.equal(+applicantMember.highestIndexYesVote, 0);
    assert.equal(applicantMember.delegateKey, applicant);
  });

  it('should abort moloch1 proposal', async () => {
    const {
      addresses,
      handler,
      api,
      token,
      provider,
    } = await setupSubscription();
    const [member, applicant] = addresses;
    await submitProposal(provider, api, token, member, applicant);

    // wait 2 seconds to enter abort window
    provider.send('evm_increaseTime', [2]);

    // get applicant provider to abort with
    const appSigner = provider.getSigner(applicant);
    const appMoloch = Moloch1Factory.connect(api.address, appSigner);
    await appMoloch.deployed();
    await appMoloch.abort(0);

    await new Promise<void>((resolve) => {
      handler.emitter.on(
        EventKind.Abort.toString(),
        (evt: CWEvent<IEventData>) => {
          assert.deepEqual(evt.data, {
            kind: EventKind.Abort,
            proposalIndex: 0,
            applicant,
          });
          resolve();
        }
      );
    });

    // verify contract storage
    const proposal = await (api as Moloch1).proposalQueue(0);
    assert.equal(proposal.aborted, true);
  });

  it('should ragequit moloch1 member', async () => {
    const {
      addresses,
      handler,
      api,
      token,
      provider,
    } = await setupSubscription();
    const [member, applicant] = addresses;
    await submitProposal(provider, api, token, member, applicant);

    // wait 2 seconds to enter voting period
    provider.send('evm_increaseTime', [2]);
    await api.submitVote(0, 1);

    // wait another 10 seconds to finish voting/grace periods
    provider.send('evm_increaseTime', [10]);
    await api.processProposal(0);

    // now that member is processed, have them ragequit
    const appSigner = provider.getSigner(applicant);
    const appMoloch = Moloch1Factory.connect(api.address, appSigner);
    await appMoloch.deployed();
    await appMoloch.ragequit(5);
    await new Promise<void>((resolve) => {
      handler.emitter.on(
        EventKind.Ragequit.toString(),
        (evt: CWEvent<IEventData>) => {
          assert.deepEqual(evt.data, {
            kind: EventKind.Ragequit,
            member: applicant,
            sharesToBurn: '5',
          });
          resolve();
        }
      );
    });

    const applicantMemberData = await api.members(applicant);
    assert.equal(applicantMemberData.exists, true);
    assert.equal(+applicantMemberData.shares, 0);
  });

  it('should update moloch1 delegate key', async () => {
    const { addresses, handler, api } = await setupSubscription();
    const [member, newDelegateKey] = addresses;

    await api.updateDelegateKey(addresses[1]);
    await new Promise<void>((resolve) => {
      handler.emitter.on(
        EventKind.UpdateDelegateKey.toString(),
        (evt: CWEvent<IEventData>) => {
          assert.deepEqual(evt.data, {
            kind: EventKind.UpdateDelegateKey,
            member,
            newDelegateKey,
          });
          resolve();
        }
      );
    });
  });

  it('should migrate past proposal started/processed/aborted events', async () => {
    const {
      addresses,
      handler,
      api,
      token,
      provider,
    } = await setupSubscription();
    const [member, applicant1, applicant2] = addresses;
    const summonTime = +(await api.summoningTime());
    const periodDuration = +(await api.periodDuration());

    // proposal 0: processed
    await submitProposal(provider, api, token, member, applicant1, true);
    provider.send('evm_increaseTime', [2]);
    await api.submitVote(0, 1);
    provider.send('evm_increaseTime', [10]);
    await api.processProposal(0);

    // proposal 1: aborted
    await submitProposal(provider, api, token, member, applicant2, true);
    provider.send('evm_increaseTime', [2]);
    const app2Signer = provider.getSigner(applicant2);
    const app2Moloch = Moloch1Factory.connect(api.address, app2Signer);
    await app2Moloch.deployed();
    await app2Moloch.abort(1);

    // proposal 2: started by prior applicant, voted on, not completed
    provider.send('evm_increaseTime', [2]);
    await token.transfer(applicant1, 20); // from summoner: you're gonna need it!
    const app1Signer = provider.getSigner(applicant1);
    const app1Token = TokenFactory.connect(token.address, app1Signer);
    await app1Token.deployed();
    const app1Moloch = Moloch1Factory.connect(api.address, app1Signer);
    await app1Moloch.deployed();
    await submitProposal(
      provider,
      app1Moloch,
      app1Token,
      applicant1,
      applicant2,
      true
    );
    provider.send('evm_increaseTime', [2]);
    await app1Moloch.submitVote(2, 2);
    provider.send('evm_increaseTime', [1]);
    await api.submitVote(2, 1);
    provider.send('evm_increaseTime', [3]);

    // perform migration
    const events: CWEvent<IEventData>[] = [];
    handler.emitter.on('*', (evt: CWEvent<IEventData>) => events.push(evt));
    const discoverReconnectRange = async (): Promise<IDisconnectedRange> => ({
      startBlock: 0,
    });
    const subscription = await subscribeEvents({
      chain: 'test',
      api,
      contractVersion: 1,
      handlers: [handler],
      skipCatchup: false,
      discoverReconnectRange,
    });
    subscription.unsubscribe();

    // validate events
    const proposalStartTimes = [
      (await (api as Moloch1).proposalQueue(0)).startingPeriod,
      (await (api as Moloch1).proposalQueue(1)).startingPeriod,
      (await (api as Moloch1).proposalQueue(2)).startingPeriod,
    ].map((period) => +period * periodDuration + summonTime);
    assert.sameDeepMembers(
      events
        .map((e) => e.data)
        .filter(
          (e) => (e as ISubmitProposal | IProcessProposal).proposalIndex === 0
        ),
      [
        {
          kind: EventKind.SubmitProposal,
          proposalIndex: 0,
          member,
          applicant: applicant1,
          tokenTribute: '5',
          sharesRequested: '5',
          details: 'hello',
          startTime: proposalStartTimes[0],
        },
        {
          kind: EventKind.ProcessProposal,
          proposalIndex: 0,
          member,
          applicant: applicant1,
          tokenTribute: '5',
          sharesRequested: '5',
          didPass: true,
          yesVotes: '1',
          noVotes: '0',
        },
      ]
    );

    assert.sameDeepMembers(
      events
        .map((e) => e.data)
        .filter((e) => (e as ISubmitProposal | IAbort).proposalIndex === 1),
      [
        {
          kind: EventKind.SubmitProposal,
          proposalIndex: 1,
          member,
          applicant: applicant2,
          tokenTribute: '0',
          sharesRequested: '5',
          details: 'hello',
          startTime: proposalStartTimes[1],
        },
        {
          kind: EventKind.Abort,
          proposalIndex: 1,
          applicant: applicant2,
        },
      ]
    );
    assert.sameDeepMembers(
      events
        .map((e) => e.data)
        .filter((e) => (e as ISubmitProposal).proposalIndex === 2),
      [
        {
          kind: EventKind.SubmitProposal,
          proposalIndex: 2,
          member: applicant1,
          applicant: applicant2,
          tokenTribute: '5',
          sharesRequested: '5',
          details: 'hello',
          startTime: proposalStartTimes[2],
        },
      ]
    );
  });
});
