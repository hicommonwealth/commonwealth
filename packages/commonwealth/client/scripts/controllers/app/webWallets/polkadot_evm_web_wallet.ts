import type { SessionSigner } from '@canvas-js/interfaces';
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
  private _currentWalletType: 'substrate' | 'evm';
  private _preferredWalletType?: 'substrate' | 'evm';

  constructor(preferredWalletType?: 'substrate' | 'evm') {
    this._preferredWalletType = preferredWalletType;
    this._currentWalletType = preferredWalletType || 'substrate';
  }

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
    const communityPrefix = app.chain?.meta?.ss58_prefix || 42;
    console.log('GetSessionSigner - Community prefix:', communityPrefix);
    console.log('GetSessionSigner - Chain:', app.chain?.meta?.id);
    console.log('GetSessionSigner - Wallet type:', this._currentWalletType);

    if (this._currentWalletType === 'evm') {
      // For EVM, we need to ensure we're using the original EVM address
      const evmAddress = this._ethAccounts[0];
      console.log('GetSessionSigner - Original EVM address:', evmAddress);

      // Convert EVM address to SS58 format
      const ss58Address = encodeEvmToSS58(evmAddress, communityPrefix);
      console.log('GetSessionSigner - Converted to SS58:', ss58Address);

      // Create signer with MetaMask signer implementation
      const evmSigner = {
        type: 'ethereum',
        signRaw: async ({ data }) => {
          console.log('GetSessionSigner - Signing data:', data);
          // Convert data to hex string if it's a Uint8Array
          const dataToSign =
            data instanceof Uint8Array
              ? '0x' + Buffer.from(data).toString('hex')
              : data;
          console.log('GetSessionSigner - Data to sign:', dataToSign);
          const signature = await this._web3.eth.personal.sign(
            dataToSign,
            evmAddress,
            '',
          );
          console.log('GetSessionSigner - Got signature:', signature);
          // Create a deterministic nonce from the message data
          const nonce =
            data instanceof Uint8Array
              ? data.slice(0, 32)
              : Buffer.from(data).slice(0, 32);
          // Convert signature to Uint8Array without '0x' prefix and recovery byte
          const sigBytes = Buffer.from(signature.slice(2, -2), 'hex');
          console.log('GetSessionSigner - Signature bytes:', sigBytes);
          return {
            signature: sigBytes,
            nonce,
          };
        },
        signMessage: async (message: string | Uint8Array) => {
          console.log('GetSessionSigner - Signing message:', message);
          // Convert Uint8Array to hex string if needed
          const messageToSign =
            message instanceof Uint8Array
              ? '0x' + Buffer.from(message).toString('hex')
              : message;
          console.log('GetSessionSigner - Message to sign:', messageToSign);
          const signature = await this._web3.eth.personal.sign(
            messageToSign,
            evmAddress,
            '',
          );
          console.log('GetSessionSigner - Got message signature:', signature);
          // Convert signature to Uint8Array without '0x' prefix and recovery byte
          const sigBytes = Buffer.from(signature.slice(2, -2), 'hex');
          console.log('GetSessionSigner - Message signature bytes:', sigBytes);
          return sigBytes;
        },
        getAddress: async () => {
          console.log(
            'GetSessionSigner - Returning SS58 address:',
            ss58Address,
          );
          return ss58Address;
        },
        getSubstrateKeyType: () => {
          console.log('GetSessionSigner - Getting key type for EVM signer');
          return 'ecdsa';
        },
      };

      // Create SubstrateSignerCW with the correct prefix
      const signer = new SubstrateSignerCW({
        extension: { signer: evmSigner },
        prefix: communityPrefix,
      });
      console.log(
        'GetSessionSigner - Created signer with prefix:',
        communityPrefix,
      );
      return signer as SessionSigner;
    } else {
      // For Substrate, get the injected signer
      const address = this._accounts[0];
      const ss58Address =
        typeof address === 'string' ? address : address.address;
      console.log('GetSessionSigner - Substrate address:', ss58Address);

      // Get the extension for the address
      const extension = await web3FromAddress(ss58Address);
      console.log('GetSessionSigner - Got extension for address');

      return new SubstrateSignerCW({
        extension,
        prefix: communityPrefix,
      }) as SessionSigner;
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
      const hasPolkadot = !!window?.injectedWeb3?.['polkadot-js'];
      const hasEthereum = !!window.ethereum;

      // Use preferred wallet type if available, otherwise fallback to available wallet
      if (this._preferredWalletType === 'substrate' && hasPolkadot) {
        await this.enableSubstrate();
      } else if (this._preferredWalletType === 'evm' && hasEthereum) {
        await this.enableEvm();
      } else if (hasPolkadot) {
        await this.enableSubstrate();
      } else if (hasEthereum) {
        await this.enableEvm();
      } else {
        throw new Error('No compatible wallet found');
      }

      await this.initAccountsChanged();
      this._enabled = true;
    } catch (error) {
      console.error('Failed to enable wallet:', error);
      throw error;
    } finally {
      this._enabling = false;
    }
  }

  private async enableSubstrate() {
    this._currentWalletType = 'substrate';
    console.log('EnableSubstrate - Starting wallet enable');
    await web3Enable('commonwealth');
    const accounts = await web3Accounts();
    console.log(
      'EnableSubstrate - Original accounts:',
      accounts.map((a) => a.address),
    );
    const communityPrefix = app.chain?.meta?.ss58_prefix || 42;
    this._accounts = accounts.map((account) => {
      // First convert to prefix 42 if needed
      const converted = addressSwapper({
        address: account.address,
        currentPrefix: communityPrefix,
      });
      console.log(
        `EnableSubstrate - Converting ${account.address} to ${converted}`,
      );
      return {
        ...account,
        address: converted,
      };
    }) as InjectedAccountWithMeta[];
    this._chainId = (await this._web3.eth.getChainId()).toString();
  }

  private async enableEvm() {
    this._currentWalletType = 'evm';
    console.log('EnableEVM - Starting wallet enable');
    let ethereum = window.ethereum;
    console.log('EnableEVM - Initial ethereum object:', !!ethereum);

    if (window.ethereum?.providers?.length) {
      console.log(
        'EnableEVM - Multiple providers found:',
        window.ethereum.providers.length,
      );
      ethereum =
        window.ethereum.providers.find((p) => p.isMetaMask) || ethereum;
      console.log(
        'EnableEVM - Selected MetaMask provider:',
        !!ethereum?.isMetaMask,
      );
    }

    if (!ethereum) {
      console.error('EnableEVM - MetaMask not available');
      throw new Error('MetaMask is not available');
    }

    try {
      console.log('EnableEVM - Requesting accounts...');
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });
      console.log('EnableEVM - Received accounts:', accounts);
    } catch (error) {
      console.error('EnableEVM - User rejected account access:', error);
      throw new Error('User rejected MetaMask connection');
    }

    console.log('EnableEVM - Initializing Web3...');
    const Web3 = (await import('web3')).default;
    this._web3 = new Web3(ethereum);

    if (!this._web3.currentProvider) {
      console.error('EnableEVM - No Web3 provider available');
      throw new Error('No Web3 provider available');
    }
    this._provider = this._web3.currentProvider;

    try {
      console.log('EnableEVM - Fetching accounts from Web3...');
      this._ethAccounts = await this._web3.eth.getAccounts();
      console.log('EnableEVM - Fetched accounts:', this._ethAccounts);

      if (this._ethAccounts.length === 0) {
        console.error('EnableEVM - No accounts found in MetaMask');
        throw new Error('Could not fetch accounts from MetaMask');
      }

      // Convert EVM addresses to substrate format if needed
      console.log('EnableEVM - Converting addresses to SS58 format...');
      this._accounts = this._ethAccounts.map((addr) => {
        const converted = encodeEvmToSS58(
          addr,
          app.chain?.meta?.ss58_prefix || 42,
        );
        console.log(`EnableEVM - Converting ${addr} to ${converted}`);
        return {
          address: converted,
          meta: {
            name: 'MetaMask Account',
            source: 'metamask',
          },
        };
      });

      this._chainId = (await this._web3.eth.getChainId()).toString();
      console.log('EnableEVM - Chain ID:', this._chainId);
    } catch (error) {
      console.error('EnableEVM - Error during account setup:', error);
      throw error;
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
