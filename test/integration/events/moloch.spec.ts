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
    debug: true,
    vmErrorsOnRPCResponse: false,
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
    17280, // _periodDuration
    35, // _votingPeriodLength
    35, // _gracePeriodLength
    12, // _abortWindow
    5, // _proposalDeposit
    3, // _diluationBound
    5, // _processingReward
  );
  return moloch1;
}

class MolochEventHandler extends IEventHandler {
  constructor(
    private readonly _emitter: EventEmitter,
  ) {
    super();
  }

  public async handle(event: CWEvent<IMolochEventData>): Promise<any> {
    this._emitter.emit(event.data.kind.toString(), event);
  }
}

describe('Moloch Event Integration Tests', () => {
  it('should summon moloch1', async () => {
    const provider = getProvider();
    const addresses = await provider.listAccounts();
    const signer = provider.getSigner(addresses[0]);
    const api: MolochApi = await deployMoloch1(signer, addresses[0], addresses[0]);
    const emitter = new EventEmitter();
    const handlers = [ new MolochEventHandler(emitter) ];
    await subscribeMolochEvents('test', api, 1, handlers, true);
    await new Promise((resolve) => {
      emitter.on(
        MolochEventKind.SummonComplete.toString(),
        (evt: CWEvent<IMolochEventData>) => {
          assert.deepEqual(evt.data, {
            kind: MolochEventKind.SummonComplete,
            summoner: addresses[0],
            shares: '0x01',
          });
          resolve();
        }
      );
    });
  });

  it('should create moloch1 proposal', async () => {
    const provider = getProvider();
    const addresses: string[] = await provider.listAccounts();
    const signer = provider.getSigner(addresses[0]);
    const token = await deployToken(signer);
    const api: MolochApi = await deployMoloch1(signer, addresses[0], token.address);
    const emitter = new EventEmitter();
    const handlers = [ new MolochEventHandler(emitter) ];
    await subscribeMolochEvents('test', api, 1, handlers, true);

    await token.transfer(addresses[1], 10);
    await token.approve(api.address, 5);

    const appSigner = provider.getSigner(addresses[1]);
    const appToken = TokenFactory.connect(token.address, appSigner);
    await appToken.deployed();
    await appToken.approve(api.address, 5);

    const summonerBalance = await token.balanceOf(addresses[0]);
    const applicantBalance = await token.balanceOf(addresses[1]);
    const summonerAllowance = await token.allowance(addresses[0], api.address);
    const applicantAllowance = await token.allowance(addresses[1], api.address);
    assert.isAtLeast(+summonerBalance, 5);
    assert.isAtLeast(+applicantBalance, 5);
    assert.isAtLeast(+summonerAllowance, 5);
    assert.isAtLeast(+applicantAllowance, 5);

    await (api as Moloch1).submitProposal(addresses[1], 5, 5, 'hello');
    await new Promise((resolve) => {
      emitter.on(
        MolochEventKind.SubmitProposal.toString(),
        (evt: CWEvent<IMolochEventData>) => {
          assert.deepEqual(evt.data, {
            kind: MolochEventKind.SubmitProposal,
            proposalIndex: 0,
            member: addresses[0],
            delegateKey: addresses[0],
            applicant: addresses[1],
            tokenTribute: '0x05',
            sharesRequested: '0x05',
          });
          resolve();
        }
      );
    });
  });

  it('should update moloch1 delegate key', async () => {
    const provider = getProvider();
    const addresses = await provider.listAccounts();
    const signer = provider.getSigner(addresses[0]);
    const api: MolochApi = await deployMoloch1(signer, addresses[0], addresses[0]);
    const emitter = new EventEmitter();
    const handlers = [ new MolochEventHandler(emitter) ];
    await subscribeMolochEvents('test', api, 1, handlers, true);
    await api.updateDelegateKey(addresses[1]);
    await new Promise((resolve) => {
      emitter.on(
        MolochEventKind.UpdateDelegateKey.toString(),
        (evt: CWEvent<IMolochEventData>) => {
          assert.deepEqual(evt.data, {
            kind: MolochEventKind.UpdateDelegateKey,
            member: addresses[0],
            newDelegateKey: addresses[1],
          });
          resolve();
        }
      );
    });
  });
});
