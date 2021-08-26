import BN from 'bn.js';
import { Near as NearApi, Contract } from 'near-api-js';
import { ITXModalData, ProposalModule } from 'models';
import { NearAccount, NearAccounts } from 'controllers/chain/near/account';
import NearChain from 'controllers/chain/near/chain';
import { notifyError } from 'controllers/app/notifications';
import NearSputnikProposal from './proposal';
import {
  INearSputnikProposal,
  NearSputnikPolicy,
  NearSputnikGetProposalResponse,
  NearSputnikProposalKind,
  isFunctionCall,
} from './types';

export default class NearSputnikDao extends ProposalModule<
  NearApi,
  INearSputnikProposal,
  NearSputnikProposal
> {
  public static async createDaoTx(creator: NearAccount, name: string, purpose: string, value: BN) {
    // get contract info from https://github.com/AngelBlock/sputnik-dao-2-mockup/blob/dev/src/config.js
    // following is mainnet
    const contractName = 'sputnik-dao.near';
    const pk = '2gtDEwdLuUBawzFLAnCS9gUso3Ph76bRzMpVrtb66f3J';

    // init contract via wallet connection
    const walletConnection = creator.walletConnection;
    const factoryContract = new Contract(
      walletConnection,
      contractName,
      { changeMethods: [ 'create' ], viewMethods: [] },
    );

    // send tx
    const argsList = {
      config: {
        name,
        purpose,
        metadata: '',
      },
      // initial council
      policy: [ creator.address ],
    };
    const yoktoNear = new BN('1000000000000000000000000');
    const amountYokto = value.mul(yoktoNear).toString();
    try {
      const args = Buffer.from(JSON.stringify(argsList)).toString('base64');
      await (factoryContract as any).create(
        {
          name,
          public_key: pk,
          args,
        },
        '150000000000000',
        amountYokto,
      );
    } catch (e) {
      console.error(e);
      notifyError('Failed to create DAO.');
    }
  }

  private _Chain: NearChain;
  private _Accounts: NearAccounts;
  private _policy: NearSputnikPolicy;
  public get policy() { return this._policy; }

  private _tokenSupply: BN;
  public get tokenSupply() { return this._tokenSupply; }

  // INIT / DEINIT
  public async init(chain: NearChain, accounts: NearAccounts) {
    this._Chain = chain;
    this._Accounts = accounts;
    this._policy = await this.query('get_policy', {});
    this._tokenSupply = new BN(await this.query('delegation_total_supply', {}));
    const res: NearSputnikGetProposalResponse[] = await this.query('get_proposals', { from_index: 0, limit: 100 });
    res.forEach((p) => new NearSputnikProposal(
      this._Chain,
      this._Accounts,
      this,
      { ...p, identifier: `${p.id}` },
    ));
    // TODO: support bounties
    this._initialized = true;
  }

  public async query<T>(method: string, args: object): Promise<T> {
    const rawResult = await this._Chain.api.connection.provider.query({
      request_type: 'call_function',
      account_id: this.app.activeChainId(),
      method_name: method,
      args_base64: Buffer.from(JSON.stringify(args)).toString('base64'),
      finality: 'optimistic',
    });
    const res = JSON.parse(Buffer.from((rawResult as any).result).toString());
    return res;
  }

  public deinit() {
    this.store.clear();
  }

  public async proposeTx(description: string, kind: NearSputnikProposalKind) {
    if (typeof kind === 'string') {
      throw new Error(`invalid proposal kind: ${kind}`);
    }

    // init contract via wallet connection
    const account = this.app.user.activeAccount as NearAccount;
    const walletConnection = account.walletConnection;
    const contract = new Contract(
      walletConnection,
      this.app.activeChainId(),
      { changeMethods: [ 'add_proposal' ], viewMethods: [] },
    );

    // TODO: user checks

    // perform tx
    try {
      console.log((contract as any).add_proposal);
      await (contract as any).add_proposal(
        {
          proposal: {
            description: description.trim(),
            kind,
          },
        },
        isFunctionCall(kind) ? '250000000000000' : '30000000000000',
        this.policy.proposal_bond,
      );
    } catch (e) {
      console.error(e);
      notifyError('Failed to add proposal.');
    }
  }

  public createTx(...args: any[]): ITXModalData {
    throw new Error('Method not implemented.');
  }
}
