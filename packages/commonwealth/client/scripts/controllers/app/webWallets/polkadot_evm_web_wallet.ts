import type {
  AbstractSessionData,
  DidIdentifier,
  Message,
  Session,
  SessionSigner,
  Signature,
  SignatureScheme,
} from '@canvas-js/interfaces';
import {
  ChainBase,
  ChainNetwork,
  SubstrateSignerCW,
  WalletId,
  addressSwapper,
} from '@hicommonwealth/shared';
import {
  web3Accounts,
  web3Enable,
  web3FromAddress,
} from '@polkadot/extension-dapp';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { encodeAddress } from '@polkadot/util-crypto';
import { setActiveAccount } from 'controllers/app/login';
import app from 'state';
import { userStore } from 'state/ui/user';
import type Web3 from 'web3';
import { Transaction, Web3BaseProvider } from 'web3';
import type BlockInfo from '../../../models/BlockInfo';
import IWebWallet from '../../../models/IWebWallet';

declare let window: any;

//create a function to encode the evm address to SS58

function encodeEvmToSS58(evmAddress: string, prefix: number = 42): string {
  // Remove '0x' prefix if present and pad to 32 bytes
  const hexAddress = evmAddress.startsWith('0x')
    ? evmAddress.slice(2)
    : evmAddress;
  const padded = hexAddress.padStart(64, '0');

  // Convert to Uint8Array
  const bytes = new Uint8Array(
    padded.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || [],
  );

  // Encode to SS58
  return encodeAddress(bytes, prefix);
}

class SubstrateEvmWebWalletController
  implements IWebWallet<InjectedAccountWithMeta | string>
{
  // GETTERS/SETTERS
  private _enabled: boolean;
  private _enabling = false;
  private _chainId: string;
  private _accounts: (InjectedAccountWithMeta | string)[] = [];
  private _ethAccounts: string[];
  private _provider: Web3BaseProvider;
  private _web3: Web3;
  private _currentWalletType: 'substrate' | 'evm' = 'substrate'; //is this needed?

  public readonly name = WalletId.SubstrateEvmMetamask;
  public readonly label = 'Substrate/EVM Wallet';
  public readonly chain = ChainBase.Substrate;
  public readonly defaultNetwork = ChainNetwork.Ethereum;
  public readonly specificChains = ['tangle'];

  public get available() {
    return window?.injectedWeb3?.['polkadot-js'] || !!window.ethereum;
  }

  public get provider() {
    return this._provider;
  }

  public get enabled() {
    return this.available && this._enabled;
  }

  public get enabling() {
    return this._enabling;
  }

  public get accounts() {
    return this._accounts || [];
  }

  public get api(): any {
    return this._web3;
  }

  public async getRecentBlock(
    chainIdentifier: string,
  ): Promise<BlockInfo | null> {
    if (this._currentWalletType === 'substrate') {
      return null;
    } else {
      try {
        if (!this._web3.currentProvider) {
          throw new Error('No provider available');
        }

        const block = await this._web3.eth.getBlock('latest');

        return {
          number: Number(block.number),
          hash: block.hash || '',
          timestamp: Number(block.timestamp),
        };
      } catch (error) {
        console.error(
          `Failed to get recent block for chain ${chainIdentifier}:`,
          error,
        );
        return null;
      }
    }
  }

  public getChainId() {
    return this._chainId;
  }

  public async getSessionSigner(): Promise<SessionSigner> {
    if (this._currentWalletType === 'substrate') {
      const accounts = await web3Accounts();
      const address = accounts[0].address;

      const reencodedAddress = addressSwapper({
        address,
        currentPrefix: 42,
      });

      const extension = await web3FromAddress(reencodedAddress);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return new SubstrateSignerCW({ extension }) as SessionSigner;
    } else {
      const chainId = await this._web3.eth.getChainId();
      const address = this._ethAccounts[0];

      const ethereumScheme: SignatureScheme = {
        type: 'ethereum',
        codecs: ['eth-personal-sign'],
        verify: async (_signature: Signature, _message: Message<unknown>) => {
          throw new Error('Not implemented');
        },
        create: (_init?: { type: string; privateKey: Uint8Array }) => {
          throw new Error('Not implemented');
        },
      };

      const signer: SessionSigner = {
        scheme: ethereumScheme,
        match: (did: DidIdentifier) => did.startsWith('did:pkh:eip155'),
        getDid: async () => {
          return `did:pkh:eip155:${chainId}:${address}` as DidIdentifier;
        },
        getDidParts: () => 42, // Using same as SubstrateSigner
        getAddressFromDid: (did: DidIdentifier) => did.split(':')[4],
        key: 'ethereum-signer',
        hasSession: (_topic: string, _did: DidIdentifier) => false,
        getSession: async (_topic: string, _options?: any) => null,
        newSession: async (_topic: string) => {
          throw new Error('Not implemented');
        },
        authorize: async (
          _data: AbstractSessionData,
          _authorizationData?: any,
        ) => {
          throw new Error('Not implemented');
        },
        verifySession: async (_topic: string, _session: Session<any>) => {
          throw new Error('Not implemented');
        },
        clear: async (_topic: string) => {
          // Implementation if needed
        },
      };

      return signer;
    }
  }

  public async signTransaction(tx: Transaction): Promise<string> {
    if (this._currentWalletType === 'evm') {
      return await this._web3.eth.personal.signTransaction(tx, '');
    }
    throw new Error('Direct transaction signing not supported for Substrate');
  }

  //ACTIONS
  public async enable() {
    console.log('Attempting to enable Substrate/EVM wallet');
    this._enabling = true;

    try {
      if (window?.injectedWeb3?.['polkadot-js']) {
        this._currentWalletType = 'substrate';
        await web3Enable('commonwealth');
        const accounts = await web3Accounts();
        this._accounts = accounts as InjectedAccountWithMeta[];
      } else if (window.ethereum) {
        this._currentWalletType = 'evm';
        let ethereum = window.ethereum;
        if (window.ethereum.providers?.length) {
          ethereum =
            window.ethereum.providers.find((p) => p.isMetaMask) || ethereum;
        }

        const Web3 = (await import('web3')).default;
        this._web3 = new Web3(ethereum);

        if (!this._web3.currentProvider) {
          throw new Error('No Web3 provider available');
        }
        this._provider = this._web3.currentProvider;

        this._ethAccounts = await this._web3.eth.getAccounts();

        if (this._ethAccounts.length === 0) {
          throw new Error('Could not fetch accounts from Metamask');
        }

        this._accounts = this._ethAccounts.map((addr) =>
          encodeEvmToSS58(addr, app.chain?.meta?.ss58_prefix || 42),
        );

        this._chainId = (await this._web3.eth.getChainId()).toString();
      } else {
        throw new Error('No compatible wallet found');
      }

      await this.initAccountsChanged();
      this._enabled = true;
    } catch (error) {
      console.error('Failed to enable wallet:', error);
    } finally {
      this._enabling = false;
    }
  }

  public async initAccountsChanged() {
    if (this._currentWalletType === 'evm') {
      await (this._web3.currentProvider as Web3BaseProvider).on(
        'accountsChanged',
        async (accounts: string[]) => {
          const updatedAddress = userStore
            .getState()
            .accounts.find((addr) => addr.address === accounts[0]);
          if (!updatedAddress) return;
          await setActiveAccount(updatedAddress);
        },
      );
    }
  }
}

export default SubstrateEvmWebWalletController;
