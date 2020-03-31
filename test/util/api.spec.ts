/*import { of, BehaviorSubject, Observable, Subject, ReplaySubject, combineLatest } from 'rxjs';
import { flatMap, skip, first, share, map } from 'rxjs/operators';
import { SubmittableResult } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import { IMethod } from 'adapters/chain/substrate/shared';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { createType, Vec, H256, Option } from '@polkadot/types';
import { EventRecord, Call, BlockNumber, Moment } from '@polkadot/types/interfaces';
import AccountId from '@polkadot/types/primitive/Generic/AccountId';
import { Codec } from '@polkadot/types/types';

// This is a mock ApiRx, used to test our data flows without requiring an active chain
export const toOption = (data?: Codec) => {
  if (data) {
    return {
      isNone: false,
      isEmpty: false,
      isSome: true,
      unwrap: () => data,
      unwrapOr: () => data,
      value: data,
    } as unknown as Option<any>;
  } else {
    return {
      isNone: true,
      isEmpty: false,
      isSome: false,
      unwrap: () => {
        throw new Error('tried to unwrap a None option');
      },
      unwrapOr: (v) => v,
      value: undefined
    } as unknown as Option<any>;
  }
};

const createEvent = (section: string, method: string, data: any[]) => {
  const eData: any = data.slice();
  eData.section = section;
  eData.method = method;
  return {
    phase: createType('Phase', { ApplyExtrinsic: createType('u32', 0) }),
    event: {
      section: section,
      method: method,
      data: eData,
      typeDef: data.map((d) => typeof d),
    }
  } as unknown as EventRecord;
};

let TX_NUM = 0;
const createTxResult = (isFinalized: boolean, isSuccess: boolean = true): SubmittableResult => {
  const result = {
    findRecord: () => undefined,
    status: createType('ExtrinsicStatus',
      isFinalized ? { finalized: createType('Hash', [TX_NUM++]) } : { ready: null }),
    events: [
      // TODO: we can't emit ExtrinsicFailed here without ensuring it is also
      //   emitted by the main event loop.
      isSuccess ? createEvent('system', 'ExtrinsicSuccess', [])
        : createEvent('system', 'ExtrinsicFailed', [])
    ]
  };
  return result as unknown as SubmittableResult;
};

export class MockApi {
  public readonly balances: { [acct: string]: number };
  public readonly accounts: AccountId[];
  public readonly SubstrateAccounts: SubstrateAccount[];
  public readonly mockMethod: Call;
  public readonly mockIMethod: IMethod;
  private _blockNumber: BehaviorSubject<BlockNumber>;
  private _blockTime: BehaviorSubject<Moment>;
  private _pendingEvents: { [n: number]: EventRecord[] } = {};
  private _blockPeriod: Moment = createType('Moment', 6);
  private _eventObs: Observable<EventRecord[]>;
  constructor() {
    // GenericCall.injectMethods(extrinsics);
    this.mockMethod = createType('Call', { args: [createType('Bytes', 'hello')], callIndex: [0, 1] });
    this.mockIMethod = {
      args: [createType('Bytes', 'hello').toU8a()],
      callIndex: new Uint8Array([0, 1]),
      section: 'system',
      call: 'remark',
      hash: this.mockMethod.hash,
    };
    this.tx.system.remark = this.mockMethod;

    // hack to add a ".at(hash)" call to this specific query
    // in an update, it may be worth converting all queries to conform with the polkadot interface
    (this.query.timestamp.now as object)['at'] = (hash) => of(+hash);

    // Alice, Bob, Charlie, Dave, Eve, Ferdie
    const accounts = [
      createType('AccountId', '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'),
      createType('AccountId', '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty'),
      createType('AccountId', '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y'),
      createType('AccountId', '5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy'),
      createType('AccountId', '5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw'),
      createType('AccountId', '5CiPPseXPECbkjWCa6MnjNokrgYjMqmKndv2rSnekmSK2DjL'),
    ];
    const balances = {
      '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY': 1000,
      '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty': 1000,
      '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y': 1000,
      '5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy': 1000,
      '5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw': 1000,
      '5CiPPseXPECbkjWCa6MnjNokrgYjMqmKndv2rSnekmSK2DjL': 1000,
    };
    this.accounts = accounts;
    this.balances = balances;
    this.setBlock();
  }

  public on(event, cb) {
    if (event === 'connected') {
      cb();
    }
    // TODO: save and trigger events to test disconnections
  }

  public setBlock(initBlock = 0) {
    this._blockNumber = new BehaviorSubject(createType('BlockNumber', initBlock));
    this._blockTime = new BehaviorSubject(createType('Moment', 0));
  }

  public advanceBlock(n = 1) {
    for (let i = 0; i < n; ++i) {
      this._blockNumber.next(createType('BlockNumber', +this._blockNumber.value + 1));
      console.log('advancing block to ' + +this._blockNumber.value);
      this._blockTime.next(createType('Moment', Date.now()));
    }
    return this._blockNumber.asObservable().pipe(first()).toPromise();
  }

  get blockNumber(): number { return +this._blockNumber.value; }

  public addConst(mod: string, func: string, val) {
    if (!this.consts[mod]) {
      this.consts[mod] = {};
    }
    this.consts[mod][func] = val;
  }
  public addQuery(mod: string, func: string, transformFn?: (...args) => Codec) {
    if (!this.query[mod]) {
      this.query[mod] = {};
    }
    const result = new ReplaySubject<Codec>(3);
    this.query[mod][func] = (...args) => {
      if (transformFn) {
        return result.asObservable().pipe(map(() => transformFn(...args)));
      } else {
        return result.asObservable();
      }
    };
    return result;
  }
  public addDerive(mod: string, func: string, transformFn?: (...args) => any) {
    if (!this.derive[mod]) {
      this.derive[mod] = {};
    }
    const result = new ReplaySubject<any>(3);
    this.derive[mod][func] = (...args) => {
      if (transformFn) {
        return result.asObservable().pipe(map(() => transformFn(...args)));
      } else {
        return result.asObservable();
      }
    };
    return result;
  }

  public addEvent(section: string, method: string, data: any[], block: number) {
    const record = createEvent(section, method, data);
    if (this._pendingEvents[block]) {
      this._pendingEvents[block].push(record);
    } else {
      this._pendingEvents[block] = [record];
    }
  }

  private createTx(successFn?: () => void) {
    return () => {
      return {
        signAndSend: (key: KeyringPair) => {
          // first emit ready
          const subject = new BehaviorSubject(createTxResult(false));

          // wait a block, then emit finalized
          // TODO: if we want to emit failed:
          //    - set createTxResult isSuccess to false
          //    - set ExtrinsicFailed variable before subscription
          this._blockNumber.pipe(skip(1), first()).subscribe((n) => {
            subject.next(createTxResult(true));
            if (successFn) {
              successFn();
            }
          });
          return subject;
        },
      };
    };
  }

  public addTx(mod: string, func: string, successFn?: () => void) {
    if (!this.tx[mod]) {
      this.tx[mod] = {};
    }
    this.tx[mod][func] = this.createTx(successFn);
  }

  public consts = {
    elections: {
      votingBond:           createType('BalanceOf', 0),
      candidacyBond:        createType('BalanceOf', 0),
      presentSlashPerVoter: createType('BalanceOf', 0),
      votingPeriod:         createType('BlockNumber', 2),
      inactiveGracePeriod:  createType('VoteIndex', 1),
    },
    democracy: {
      launchPeriod:   createType('BalanceOf', 0),
      minimumDeposit: createType('BalanceOf', 0),
    },
    balances: {
      existentialDeposit: createType('Balance', 0),
      transferFee:        createType('Balance', 0),
      creationFee:        createType('Balance', 0),
    },
    timestamp: {
      minimumPeriod: this._blockPeriod,
    },
    treasury: {
      proposalBondMinimum: createType('BalanceOf', 100),
      proposalBond:        createType('Permill', 10_000),
    },
  };

  public queryMulti(queries) {
    return combineLatest(queries.map((query) => {
      if (Array.isArray(query)) {
        const call = query[0];
        const args = query.slice(1);
        return call(...args);
      } else {
        return query();
      }
    }));
  }
  public query = {
    system: {
      // TODO: rework this to give us a BehaviorSubject to play with
      events: (): Observable<EventRecord[]> => {
        if (!this._eventObs) {
          this._eventObs = this._blockNumber.pipe(
            flatMap((n: BlockNumber) => {
              let events: EventRecord[] = [];
              if (this._pendingEvents[+n]) {
                events = this._pendingEvents[+n];
                delete this._pendingEvents[+n];
              }
              // TODO: sometimes extrinsics fail, build that in
              events.push(createEvent('system', 'ExtrinsicSuccess', []));
              return of(events);
            }),
            share(),
          );
        }
        return this._eventObs;
      },
      blockHash: {
        multi: (a: BlockNumber[]) => of([1, 2, 3, 4, 5]),
      }
    },
    sudo: {
      key: () => of(createType('AccountId', [123])),
    },
    timestamp: {
      now: () => this._blockTime.asObservable(),
    },
    balances: {
      totalIssuance:       () => of(createType('Balance', 5000)),
      reservedBalance: (acct) => of(createType('Balance', 0)),
      locks:           (acct) => of([]),
      freeBalance:     (acct: string) => {
        if (this.balances[acct]) {
          return of(createType('Balance', this.balances[acct]));
        }
        return of(createType('Balance', 0));
      },
    },
    democracy: {
      nextExternal: () => of(toOption()),
      lastTabledWasExternal: () => of(createType('bool', true)),
      delegations:  () => of(
        [[createType('AccountId', [0]), createType('Conviction', 0)], null]),
      proxy:        () => of(toOption()),
    },
    elections: {
      members:              () => of([[this.accounts[0], 1], [this.accounts[1], 5]]),
      presentationDuration: () => of(createType('BlockNumber', 2)),
      termDuration:         () => of(createType('BlockNumber', 5)),
      nextFinalize:         () => of(toOption()),
      snapshotedStakes:     () => of([]),
      voters:               () => of([]),
      voteCount:            () => of(createType('VoteIndex', 0)),
      candidates:           () => of([]),
      desiredSeats:         () => of(2),
      carryCount:           () => of(1),
      leaderboard:          () => of(toOption()),
    },
    council: {
      members: () => of(new Vec(AccountId)),
      proposals: () => of(new Vec(H256)),
    },
    technicalCommittee: {
      members: () => of(new Vec(AccountId)),
      proposals: () => of(new Vec(H256)),
    },
    signaling: {
      proposalCreationBond: () => of(createType('BalanceOf', 0)),
      votingLength: () => of(createType('BlockNumber', 10)),
      inactiveProposals: () => of([]),
      activeProposals: () => of([]),
      completedProposals: () => of([]),
    },
    session: {
      validators: () => of([]),
    },
    staking: {
      stakers: (acct) => {
        return of({ own: createType('Balance', 0), total: createType('Balance', 0), others: [] });
      },
    },
  };
  public rpc = {
    system: {
      chain:   () => of('edgeware'),
      version: () => of('0.5'),
      name:    () => of('edgeware'),
    }
  };
  public tx = {
    system: {
      remark: null,
    }
  };
  public derive = {
    chain: {
      bestNumber: (): Observable<BlockNumber> => this._blockNumber.asObservable()
    }
  };
  get isReady() {
    return of(this);
  }
}
*/