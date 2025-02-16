import type { SessionSigner } from '@canvas-js/interfaces';
import {
  ChainBase,
  ChainNetwork,
  WalletId,
} from '@hicommonwealth/shared';
import { SIWESigner } from '@canvas-js/chain-ethereum';
import Web3, { Transaction, Web3BaseProvider } from 'web3';
import type BlockInfo from '../../../models/BlockInfo';
import IWebWallet from '../../../models/IWebWallet';
import { encodeAddress } from '@polkadot/util-crypto';

declare let window: any;

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

class SubstrateEvmWebWalletController implements IWebWallet<string> {
  private _enabled: boolean;
  private _enabling = false;
  private _chainId: string;
  private _accounts: string[] = [];
  private _ss58Accounts: string[] = [];
  private _provider: Web3BaseProvider;
  private _web3: Web3;

  public readonly name = WalletId.SubstrateEvmMetamask;
  public readonly label = 'EVM Wallet';
  public readonly chain = ChainBase.Substrate;
  public readonly defaultNetwork = ChainNetwork.Ethereum;
  public readonly specificChains = ['tangle'];

  public get available() {
    return !!window.ethereum;
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
    return this._ss58Accounts || [];
  }

  public get api(): any {
    return this._web3;
  }

  public async getRecentBlock(chainIdentifier: string): Promise<BlockInfo | null> {
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

  public getChainId() {
    return this._chainId;
  }

  public async getSessionSigner(): Promise<SessionSigner> {
    const evmAddress = this._accounts[0];
    console.log('GetSessionSigner - EVM address:', evmAddress);
    
    const ss58Address = encodeEvmToSS58(evmAddress);
    console.log('GetSessionSigner - SS58 address:', ss58Address);

    return new SIWESigner({
      signer: {
        getAddress: async () => ss58Address,
        signMessage: async (message: string) => {
          return await this._web3.eth.personal.sign(message, evmAddress, '');
        },
      },
    }) as SessionSigner;
  }

  public async signTransaction(tx: Transaction): Promise<string> {
    return await this._web3.eth.personal.signTransaction(tx, '');
  }

  public async enable() {
    console.log('Attempting to enable EVM wallet');
    this._enabling = true;

    try {
      if (!window.ethereum) {
        throw new Error('No EVM provider found');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      // Get chain ID
      const chainId = await window.ethereum.request({
        method: 'eth_chainId',
      });

      this._chainId = chainId;
      this._accounts = accounts;
      // Convert EVM addresses to SS58 format
      this._ss58Accounts = accounts.map(addr => encodeEvmToSS58(addr));
      this._provider = window.ethereum;
      this._web3 = new Web3(window.ethereum);
      this._enabled = true;

      await this.initAccountsChanged();
      console.log('EVM wallet enabled successfully');
    } catch (error) {
      console.error('Failed to enable EVM wallet:', error);
      throw error;
    } finally {
      this._enabling = false;
    }
  }

  public async initAccountsChanged() {
    if (!window.ethereum) return;

    window.ethereum.on('accountsChanged', async (accounts: string[]) => {
      console.log('EVM accounts changed:', accounts);
      this._accounts = accounts;
      this._ss58Accounts = accounts.map(addr => encodeEvmToSS58(addr));
    });

    window.ethereum.on('chainChanged', async (chainId: string) => {
      console.log('EVM chain changed:', chainId);
      this._chainId = chainId;
      window.location.reload();
    });
  }
}

export default SubstrateEvmWebWalletController;
