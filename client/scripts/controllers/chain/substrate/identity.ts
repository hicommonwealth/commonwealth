import BN from 'bn.js';
import { Identity } from 'models';
import { IHasId, ISerializable } from 'stores';
import { SubstrateCoin } from 'adapters/chain/substrate/types';
import {
  RegistrationJudgement,
  BalanceOf,
  AccountId,
  IdentityInfo,
} from '@polkadot/types/interfaces';
import { Codec } from '@polkadot/types/types';
import { Vec, Option } from '@polkadot/types';
import { Data } from '@polkadot/types/primitive';
import { u8aToString } from '@polkadot/util';
import { ApiPromise } from '@polkadot/api';
import SubstrateChain from './shared';
import SubstrateAccounts, { SubstrateAccount } from './account';
import SubstrateIdentities, { SuperCodec } from './identities';

export interface IIdentitySubs {
  subs: SubstrateAccount[];
  deposit: SubstrateCoin;
}

type SubsCodec = [ BalanceOf, Vec<AccountId> ] & Codec;

export enum IdentityQuality {
  Good = 'good',
  Bad = 'bad',
  Unknown = 'unknown',
}

export interface ISubstrateIdentity extends IHasId {
  address: string;
  username: string;
  quality: IdentityQuality;
  deposit: string;
  exists: boolean;
}

// fetch quality based on Polkadot identity judgements. See:
// https://github.com/polkadot-js/apps/blob/master/packages/react-components/src/AccountName.tsx#L126
// https://github.com/polkadot-js/apps/blob/master/packages/react-components/src/AccountName.tsx#L182
export function getIdentityQuality(judgements: string[]): IdentityQuality {
  const isGood = judgements.some((j) => j === 'KnownGood' || j === 'known-good'
                                 || j === 'Reasonable' || j === 'reasonable');
  const isBad = judgements.some((j) => j === 'Erroneous' || j === 'erroneous');
  if (isGood) {
    return IdentityQuality.Good;
  } else if (isBad) {
    return IdentityQuality.Bad;
  } else {
    return IdentityQuality.Unknown;
  }
}

export default class SubstrateIdentity
  extends Identity<SubstrateCoin>
  implements ISerializable<ISubstrateIdentity> {
  // override identity prop
  public readonly account: SubstrateAccount;

  private _judgements: RegistrationJudgement[];
  private _info: IdentityInfo;
  public get info() { return this._info; }

  private _quality: IdentityQuality;
  public get quality() { return this._quality; }

  private _deposit: SubstrateCoin;
  public get deposit() { return this._deposit; }

  // set to false if identity was killed or cleared, null if unresolved
  private _exists: boolean;
  public get exists() { return this._exists; }

  // fetch all sub-accounts
  // all sub-accounts have names, but we don't currently fetch them, because
  // that requires a backward lookup for each. instead we expose a getter.
  public subs(): Promise<IIdentitySubs> {
    return this._Chain.api.query.identity.subsOf(this.account.address)
      .then((subResult: SubsCodec) => ({
        deposit: this._Chain.coins(subResult[0]),
        subs: subResult[1].map((v) => this._Accounts.get(v.toString())),
      }));
  }

  private _Chain: SubstrateChain;
  private _Accounts: SubstrateAccounts;
  private _Identities: SubstrateIdentities;

  // keeps track of changing registration info
  public async update() {
    const rOpt = await this._Chain.api.query.identity.identityOf(this.account.address);
    if (rOpt.isSome) {
      const { judgements, deposit, info } = rOpt.unwrap();
      this._judgements = judgements;
      this._info = info;
      this._deposit = this._Chain.coins(deposit);

      // update username
      const d2s = (d: Data) => u8aToString(d.toU8a()).replace(/[^\x20-\x7E]/g, '');
      this.username = d2s(this._info.display);
      const quality = getIdentityQuality(this._judgements.map((j) => j[1].toString()));
      if (!this._quality || quality !== IdentityQuality.Unknown) {
        this._quality = quality;
      }
      if (this._Identities.store.getById(this.id)) {
        this._Identities.store.update(this);
      } else {
        this._Identities.store.add(this);
      }

      this._exists = true;
    } else {
      this._exists = false;
      this._judgements = [];
      this._quality = IdentityQuality.Unknown;
      this._deposit = this._Chain.coins(0);
    }
  }

  public serialize(): ISubstrateIdentity {
    return {
      id: this.id,
      address: this.account.address,
      username: this.username,
      quality: this.quality,
      deposit: this.deposit.toString('hex'),
      exists: this.exists,
    };
  }

  public deserialize(data: ISubstrateIdentity): Promise<void> {
    // console.log(`Revived identity from localStorage: ${data.username}.`);
    this._deposit = this._Chain.coins(new BN(data.deposit, 'hex'));
    this._quality = data.quality;
    this.username = data.username;
    this._exists = data.exists;
    return this.update();
  }

  constructor(
    ChainInfo: SubstrateChain,
    Accounts: SubstrateAccounts,
    Identities: SubstrateIdentities,
    who: SubstrateAccount,
  ) {
    // we use the address of the identity's owner as its identifier
    super(who, who.address);

    this._Chain = ChainInfo;
    this._Accounts = Accounts;
    this._Identities = Identities;
  }

  public subName(sub: SubstrateAccount): Promise<string> {
    return this._Chain.api.query.identity.superOf(sub.address)
      .then((dataOpt: Option<SuperCodec>) => {
        if (!dataOpt.isSome) {
          throw new Error('provided account is not a sub');
        }
        const [ superAcct, name ] = dataOpt.unwrap();
        if (superAcct.toString() !== this.account.address) {
          throw new Error('provided account is not your sub');
        }
        return name.toString();
      });
  }

  // TRANSACTIONS

  // arg is mapping from sub address to name
  public async setSubsTx(subs: { [address: string]: string }) {
    const txFunc = (api: ApiPromise) => api.tx.identity.setSubs(Object.entries(subs));
    return this._Chain.createTXModalData(
      this.account,
      txFunc,
      'setSubs',
      `${this.username} updated subs`,
    );
  }

  public clearTx() {
    return this._Chain.createTXModalData(
      this.account,
      (api: ApiPromise) => api.tx.identity.clearIdentity(),
      'clearIdentity',
      `${this.account.address} cleared identity`,
    );
  }

  public async requestJudgementTx(regIdx: number, maxFee: SubstrateCoin) {
    if (!this._judgements) throw new Error('judgements not yet loaded');
    const txFunc = (api: ApiPromise) => api.tx.identity.requestJudgement(regIdx, maxFee);
    return this._Chain.createTXModalData(
      this.account,
      txFunc,
      'requestjudgement',
      `${this.username} requests judgement from registrar ${regIdx}`,
    );
  }

  public canceljudgementRequestTx(regIdx: number) {
    if (!this._judgements) throw new Error('judgements not yet loaded');
    return this._Chain.createTXModalData(
      this.account,
      (api: ApiPromise) => api.tx.identity.cancelRequest(regIdx),
      'cancelRequest',
      `${this.username} canceled judgement request from registrar ${regIdx}`,
    );
  }
}
