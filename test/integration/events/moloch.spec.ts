import { providers } from 'ethers';
import chai from 'chai';
import { EventEmitter } from 'events';
import { Moloch1Factory } from '../../../eth/types/Moloch1Factory';
import { Moloch1 } from '../../../eth/types/Moloch1';
import { MolochApi, IMolochEventData, MolochEventKind } from '../../../shared/events/moloch/types';
import subscribeMolochEvents from '../../../shared/events/moloch/index';
import { IEventHandler, CWEvent } from '../../../shared/events/interfaces';

const { assert } = chai;

function getProvider(): providers.Web3Provider {
  // eslint-disable-next-line global-require
  const web3Provider = require('ganache-cli').provider();
  return new providers.Web3Provider(web3Provider);
}

async function deployMoloch1(signer, summoner): Promise<Moloch1> {
  const factory = new Moloch1Factory(signer);
  const moloch1 = await factory.deploy(
    summoner,
    summoner,
    17280, // _periodDuration
    35, // _votingPeriodLength
    35, // _gracePeriodLength
    12, // _abortWindow
    '10000000', // _proposalDeposit
    3, // _diluationBound
    '10000000', // _processingReward
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
  it('should summon moloch1', (done) => {
    const provider = getProvider();
    let addresses: string[];
    let api: MolochApi;
    provider.listAccounts().then((results) => {
      addresses = results;
      const signer = provider.getSigner(addresses[0]);
      return deployMoloch1(signer, addresses[0]);
    }).then((result) => {
      api = result;
      const emitter = new EventEmitter();
      emitter.on(
        MolochEventKind.SummonComplete.toString(),
        (evt: CWEvent<IMolochEventData>) => {
          console.log(evt);
          done();
        }
      );
      const handlers = [
        new MolochEventHandler(emitter),
      ];
      return subscribeMolochEvents(
        'moloch-test',
        api,
        1,
        handlers,
        true,
      );
    }).then((subscriber) => {
      return api.updateDelegateKey(addresses[1]);
    });
  });

  it('should update delegate key', (done) => {
    const provider = getProvider();
    let addresses: string[];
    let api: MolochApi;
    provider.listAccounts().then((results) => {
      addresses = results;
      const signer = provider.getSigner(addresses[0]);
      return deployMoloch1(signer, addresses[0]);
    }).then((result) => {
      api = result;
      const emitter = new EventEmitter();
      emitter.on(
        MolochEventKind.UpdateDelegateKey.toString(),
        (evt: CWEvent<IMolochEventData>) => {
          assert.deepEqual(evt.data, {
            kind: MolochEventKind.UpdateDelegateKey,
            member: addresses[0],
            newDelegateKey: addresses[1],
          });
          done();
        }
      );
      const handlers = [
        new MolochEventHandler(emitter),
      ];
      return subscribeMolochEvents(
        'moloch-test',
        api,
        1,
        handlers,
        true,
      );
    }).then((subscriber) => {
      return api.updateDelegateKey(addresses[1]);
    });
  });
});
