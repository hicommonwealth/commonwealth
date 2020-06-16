import { providers } from 'ethers';
import chai from 'chai';
import { EventEmitter } from 'events';
import { Moloch1Factory } from '../../../eth/types/Moloch1Factory';
import { Moloch1 } from '../../../eth/types/Moloch1';
import { TokenFactory } from '../../../eth/types/TokenFactory';
import { Token } from '../../../eth/types/Token';
import { MolochApi, IMolochEventData, MolochEventKind } from '../../../shared/events/moloch/types';
import subscribeMolochEvents from '../../../shared/events/moloch/index';
import { IEventHandler, CWEvent } from '../../../shared/events/interfaces';

const { assert } = chai;

function getProvider(): providers.Web3Provider {
  // eslint-disable-next-line global-require
  const web3Provider = require('ganache-cli').provider({
    allowUnlimitedContractSize: true,
    gasLimit: 1000000000,
    time: new Date(1000),
    // logger: console,
  });
  return new providers.Web3Provider(web3Provider);
}

async function deployToken(signer) {
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
    5, // _processingReward
  );
  return moloch1;
}

class MolochEventHandler extends IEventHandler {
  constructor(
    public readonly emitter: EventEmitter,
  ) {
    super();
  }

  public async handle(event: CWEvent<IMolochEventData>): Promise<any> {
    this.emitter.emit(event.data.kind.toString(), event);
    this.emitter.emit('*', event);
  }
}

interface ISetupData {
  api: MolochApi;
  token: Token;
  addresses: string[];
  provider: providers.Web3Provider;
  handler: MolochEventHandler;
}

async function setupSubscription(subscribe = true): Promise<ISetupData> {
  const provider = getProvider();
  const addresses: string[] = await provider.listAccounts();
  const [ member ] = addresses;
  const signer = provider.getSigner(member);
  const token = await deployToken(signer);
  const api: MolochApi = await deployMoloch1(signer, member, token.address);
  const emitter = new EventEmitter();
  const handler = new MolochEventHandler(emitter);
  if (subscribe) {
    await subscribeMolochEvents('test', api, 1, [ handler ], true);
  }
  return { api, token, addresses, provider, handler };
}

async function submitProposal(
  provider: providers.Web3Provider,
  api: MolochApi,
  token: Token,
  member: string,
  applicant: string
): Promise<void> {
  await token.transfer(applicant, 10);
  await token.approve(api.address, 5);

  const appSigner = provider.getSigner(applicant);
  const appToken = TokenFactory.connect(token.address, appSigner);
  await appToken.deployed();
  await appToken.approve(api.address, 5);

  const summonerBalance = await token.balanceOf(member);
  const applicantBalance = await token.balanceOf(applicant);
  const summonerAllowance = await token.allowance(member, api.address);
  const applicantAllowance = await token.allowance(applicant, api.address);
  assert.isAtLeast(+summonerBalance, 5);
  assert.isAtLeast(+applicantBalance, 5);
  assert.isAtLeast(+summonerAllowance, 5);
  assert.isAtLeast(+applicantAllowance, 5);

  await (api as Moloch1).submitProposal(applicant, 5, 5, 'hello');
}

describe('Moloch Event Integration Tests', () => {
  it('should summon moloch1', async () => {
    const { addresses, handler } = await setupSubscription();
    await new Promise((resolve) => {
      handler.emitter.on(
        MolochEventKind.SummonComplete.toString(),
        (evt: CWEvent<IMolochEventData>) => {
          assert.deepEqual(evt.data, {
            kind: MolochEventKind.SummonComplete,
            summoner: addresses[0],
            shares: '1',
          });
          resolve();
        }
      );
    });
  });

  it('should create moloch1 proposal', async () => {
    const { addresses, handler, api, token, provider } = await setupSubscription();
    const [ member, applicant ] = addresses;
    const summonTime = await api.summoningTime();
    await submitProposal(provider, api, token, member, applicant);
    await new Promise((resolve) => {
      handler.emitter.on(
        MolochEventKind.SubmitProposal.toString(),
        (evt: CWEvent<IMolochEventData>) => {
          assert.deepEqual(evt.data, {
            kind: MolochEventKind.SubmitProposal,
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
    const { addresses, handler, api, token, provider } = await setupSubscription();
    const [ member, applicant ] = addresses;
    await submitProposal(provider, api, token, member, applicant);

    // wait 2 seconds to enter voting period
    provider.send('evm_increaseTime', [2]);
    await api.submitVote(0, 2);
    await new Promise((resolve) => {
      handler.emitter.on(
        MolochEventKind.SubmitVote.toString(),
        (evt: CWEvent<IMolochEventData>) => {
          assert.deepEqual(evt.data, {
            kind: MolochEventKind.SubmitVote,
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
    const { addresses, handler, api, token, provider } = await setupSubscription();
    const [ member, applicant ] = addresses;
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
    await new Promise((resolve) => {
      handler.emitter.on(
        MolochEventKind.ProcessProposal.toString(),
        (evt: CWEvent<IMolochEventData>) => {
          assert.deepEqual(evt.data, {
            kind: MolochEventKind.ProcessProposal,
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
    const { addresses, handler, api, token, provider } = await setupSubscription();
    const [ member, applicant ] = addresses;
    await submitProposal(provider, api, token, member, applicant);

    // wait 2 seconds to enter abort window
    provider.send('evm_increaseTime', [2]);

    // get applicant provider to abort with
    const appSigner = provider.getSigner(applicant);
    const appMoloch = Moloch1Factory.connect(api.address, appSigner);
    await appMoloch.deployed();
    await appMoloch.abort(0);

    await new Promise((resolve) => {
      handler.emitter.on(
        MolochEventKind.Abort.toString(),
        (evt: CWEvent<IMolochEventData>) => {
          assert.deepEqual(evt.data, {
            kind: MolochEventKind.Abort,
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
    const { addresses, handler, api, token, provider } = await setupSubscription();
    const [ member, applicant ] = addresses;
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
    await new Promise((resolve) => {
      handler.emitter.on(
        MolochEventKind.Ragequit.toString(),
        (evt: CWEvent<IMolochEventData>) => {
          assert.deepEqual(evt.data, {
            kind: MolochEventKind.Ragequit,
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
    const [ member, newDelegateKey ] = addresses;

    await api.updateDelegateKey(addresses[1]);
    await new Promise((resolve) => {
      handler.emitter.on(
        MolochEventKind.UpdateDelegateKey.toString(),
        (evt: CWEvent<IMolochEventData>) => {
          assert.deepEqual(evt.data, {
            kind: MolochEventKind.UpdateDelegateKey,
            member,
            newDelegateKey,
          });
          resolve();
        }
      );
    });
  });

  it('should migrate past proposal started/processed/aborted events', async () => {
    const { addresses, handler, api, token, provider } = await setupSubscription();
    const [ member, applicant1, applicant2 ] = addresses;
    const summonTime = +(await api.summoningTime());
    const periodDuration = +(await api.periodDuration());

    // proposal 0: processed
    await submitProposal(provider, api, token, member, applicant1);
    provider.send('evm_increaseTime', [2]);
    await api.submitVote(0, 1);
    provider.send('evm_increaseTime', [10]);
    await api.processProposal(0);

    // proposal 1: aborted
    await submitProposal(provider, api, token, member, applicant2);
    provider.send('evm_increaseTime', [2]);
    const app2Signer = provider.getSigner(applicant2);
    const app2Moloch = Moloch1Factory.connect(api.address, app2Signer);
    await app2Moloch.deployed();
    await app2Moloch.abort(1);

    // proposal 2: started by prior applicant, voted on, not completed
    await token.transfer(applicant1, 20);  // from summoner: you're gonna need it!
    const app1Signer = provider.getSigner(applicant1);
    const app1Token = TokenFactory.connect(token.address, app1Signer);
    await app1Token.deployed();
    const app1Moloch = Moloch1Factory.connect(api.address, app1Signer);
    await app1Moloch.deployed();
    await submitProposal(provider, app1Moloch, app1Token, applicant1, applicant2);
    provider.send('evm_increaseTime', [2]);
    await app1Moloch.submitVote(2, 2);
    await api.submitVote(2, 1);

    // perform migration
    const events: CWEvent<IMolochEventData>[] = [];
    handler.emitter.on('*', (evt: CWEvent<IMolochEventData>) => events.push(evt));
    const discoverReconnectRange = async () => ({ startBlock: 0 });
    const subscription = await subscribeMolochEvents('test', api, 1, [ handler ], false, discoverReconnectRange);
    subscription.unsubscribe();

    // validate events
    const proposalStartTimes = [
      (await (api as Moloch1).proposalQueue(0)).startingPeriod,
      (await (api as Moloch1).proposalQueue(1)).startingPeriod,
      (await (api as Moloch1).proposalQueue(2)).startingPeriod,
    ].map((period) => (+period * periodDuration) + summonTime);
    assert.sameDeepMembers(events.map((e) => e.data).filter((e) => (e as any).proposalIndex === 0), [
      {
        kind: MolochEventKind.SubmitProposal,
        proposalIndex: 0,
        member,
        applicant: applicant1,
        tokenTribute: '5',
        sharesRequested: '5',
        details: 'hello',
        startTime: proposalStartTimes[0],
      },
      {
        kind: MolochEventKind.ProcessProposal,
        proposalIndex: 0,
        member,
        applicant: applicant1,
        tokenTribute: '5',
        sharesRequested: '5',
        didPass: true,
        yesVotes: '1',
        noVotes: '0',
      },
    ]);

    assert.sameDeepMembers(events.map((e) => e.data).filter((e) => (e as any).proposalIndex === 1), [
      {
        kind: MolochEventKind.SubmitProposal,
        proposalIndex: 1,
        member,
        applicant: applicant2,
        tokenTribute: '0',
        sharesRequested: '5',
        details: 'hello',
        startTime: proposalStartTimes[1],
      },
      {
        kind: MolochEventKind.Abort,
        proposalIndex: 1,
        applicant: applicant2,
      }
    ]);
    assert.sameDeepMembers(events.map((e) => e.data).filter((e) => (e as any).proposalIndex === 2), [
      {
        kind: MolochEventKind.SubmitProposal,
        proposalIndex: 2,
        member: applicant1,
        applicant: applicant2,
        tokenTribute: '5',
        sharesRequested: '5',
        details: 'hello',
        startTime: proposalStartTimes[2],
      },
    ]);
  });
});
