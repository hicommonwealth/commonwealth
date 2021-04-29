import app from 'state';

import { AccountData, OfflineSigner, SigningCosmosClient } from '@cosmjs/launchpad';

import { Account, ChainBase, IWebWallet } from 'models';
import { validationTokenToSignDoc } from 'adapters/chain/cosmos/keys';
import { Window as KeplrWindow } from '@keplr-wallet/types';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Window extends KeplrWindow {}
}

class KeplrWebWalletController implements IWebWallet<AccountData> {
  // GETTERS/SETTERS
  private _offlineSigner: OfflineSigner;
  private _accounts: readonly AccountData[];
  private _enabled: boolean;
  private _enabling: boolean = false;

  public readonly label = 'Cosmos Wallet (keplr)';
  public readonly chain = ChainBase.CosmosSDK;

  public get available() {
    return window.getOfflineSigner && !!window.keplr;
  }
  public get enabling() {
    return this._enabling;
  }
  public get enabled() {
    return this.available && this._enabled;
  }
  public get accounts() {
    return this._accounts || [];
  }
  public get offlineSigner() {
    return this._offlineSigner;
  }

  public async validateWithAccount(account: Account<any>): Promise<void> {
    if (!this.offlineSigner) throw new Error('Missing or misconfigured web wallet');
    const client = new SigningCosmosClient(
      // TODO: Figure out our own nodes, these are ported from the Keplr example code.
      app.chain.meta.chain.network === 'cosmos'
        ? 'https://node-cosmoshub-3.keplr.app/rest'
        : app.chain.meta.chain.network === 'straightedge'
          ? 'https://node-straightedge-2.keplr.app/rest'
          : '',
      account.address,
      this.offlineSigner,
    );

    // Get the verification token & placeholder TX to send
    const signDoc = await validationTokenToSignDoc(account.address, account.validationToken);

    // Some typing and versioning issues here...signAmino should be available but it's not
    const signature = await ((client as any).signer.signAmino
      ? (client as any).signer.signAmino(account.address, signDoc)
      : (client as any).signer.sign(account.address, signDoc));
    return account.validate(JSON.stringify(signature));
  }

  // ACTIONS
  public async enable() {
    console.log('Attempting to enable Keplr web wallet');

    if (!window.keplr?.experimentalSuggestChain) {
      alert('Please update to a more recent version of Keplr');
      return;
    }

    // get the chain id to enable
    if (!app.chain?.id || !app.chain?.meta?.chain?.id) return;
    const chainId = app.chain.meta.chain.id === 'straightedge' ? 'straightedge-2'
      : app.chain.meta.chain.id === 'cosmos' ? 'cosmoshub-3'
        : null;
    if (!chainId) return;

    // enable
    this._enabling = true;
    try {
      await window.keplr.enable(chainId);
      console.log(`Enabled web wallet for ${chainId}`);
      this._offlineSigner = window.getOfflineSigner(chainId);
      this._accounts = await this._offlineSigner.getAccounts();
      this._enabled = true;
      this._enabling = false;
    } catch (error) {
      console.error('Failed to enable keplr wallet');
      this._enabling = false;
    }
  }
}

export default KeplrWebWalletController;
