import {Account as NearJsAccount} from "near-api-js/lib/account";
import NearChain from "controllers/chain/near/chain";
import {IApp} from "state";
import {NearToken} from "adapters/chain/near/types";
import {AccountView} from "near-api-js/lib/providers/provider";
import {NearAccounts} from "controllers/chain/near/accounts";

export class NearAccount extends Account {
  private _walletConnection: NearJsAccount;
  public get walletConnection() {
    return this._walletConnection;
  }

  private _Accounts: NearAccounts;
  private _Chain: NearChain;

  constructor(
    app: IApp,
    Chain: NearChain,
    Accounts: NearAccounts,
    address: string
  ) {
    super({ chain: app.chain.meta, address });
    this._walletConnection = new NearJsAccount(Chain.api.connection, address);
    this._Chain = Chain;
    this._Accounts = Accounts;
    this._Accounts.store.add(this);
  }

  public get balance(): Promise<NearToken> {
    return this._walletConnection.state().then((s: AccountView) => {
      return this._Chain.coins(s.amount, false);
    });
  }

  public async signMessage(message: string): Promise<string> {
    if (!this._walletConnection.connection?.signer) {
      throw new Error('no signer found!');
    }
    const kp = await this._Accounts.keyStore.getKey(
      this._Chain.isMainnet ? 'mainnet' : 'testnet',
      this.address
    );
    const { publicKey, signature } = kp.sign(Buffer.from(message));
    return JSON.stringify({
      signature: Buffer.from(signature).toString('base64'),
      publicKey: Buffer.from(publicKey.data).toString('base64'),
    });
  }
}
