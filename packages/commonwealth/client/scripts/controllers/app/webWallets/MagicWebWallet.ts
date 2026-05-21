import type { ExternalProvider } from '@ethersproject/providers';
import type Web3 from 'web3';
import type BlockInfo from '../../../models/BlockInfo';
import type IWebWallet from '../../../models/IWebWallet';

import { hexToNumber } from 'web3-utils';

import { SIWESigner } from '@canvas-js/chain-ethereum';
import { ChainBase, ChainNetwork, WalletId } from '@hicommonwealth/shared';
import { fetchNodes } from 'client/scripts/state/api/nodes';
import { setActiveAccount } from 'controllers/app/login';
import { Magic } from 'magic-sdk';
import app from 'state';
import { fetchCachedPublicEnvVar } from 'state/api/configuration';
import { userStore } from 'state/ui/user';
import { getMagicInstanceForChain } from 'utils/magicNetworkUtils';

class MagicWebWalletController implements IWebWallet<string> {
  // GETTERS/SETTERS
  private _enabled: boolean;
  private _enabling = false;
  private _accounts: string[];
  private _provider: ExternalProvider;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _web3: Web3 | any;
  private _accountsChangedHandler?: (accounts: string[]) => Promise<void>;
  private _chainChangedHandler?: (chainId: string) => Promise<void>;
  private _disconnectHandler?: (error?: unknown) => Promise<void>;

  public readonly name = WalletId.Magic;
  public readonly label = 'Magic';
  public readonly defaultNetwork = ChainNetwork.Ethereum;
  public readonly chain = ChainBase.Ethereum;

  public get available() {
    const { MAGIC_PUBLISHABLE_KEY } = fetchCachedPublicEnvVar() || {};
    return !!MAGIC_PUBLISHABLE_KEY;
  }

  public get provider(): ExternalProvider {
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

  public get api() {
    return this._web3;
  }

  public getChainId() {
    // We need app.chain? because the app might not be on a page with a chain (e.g homepage),
    // and node? because the chain might not have a node provided
    return app.chain?.meta?.ChainNode?.eth_chain_id?.toString() || '1';
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async getRecentBlock(chainIdentifier: string): Promise<BlockInfo> {
    const block = await this._web3.givenProvider.request({
      method: 'eth_getBlockByNumber',
      params: ['latest', false],
    });

    return {
      number: Number(hexToNumber(block.number)),
      hash: block.hash,
      timestamp: Number(hexToNumber(block.timestamp)),
    };
  }

  public getSessionSigner() {
    return new SIWESigner({
      signer: {
        signMessage: (message) =>
          this._web3.givenProvider.request({
            method: 'personal_sign',
            params: [this.accounts[0], message],
          }),
        getAddress: () => this.accounts[0],
      },
      chainId: parseInt(this.getChainId()),
    });
  }

  // ACTIONS
  public async enable(forceChainId?: string) {
    this._enabling = true;
    try {
      const chainIdStr = forceChainId ?? this.getChainId();
      const chainIdNum = parseInt(chainIdStr, 10);

      const nodes = await fetchNodes();
      const chainNode = nodes.find((n) => n.ethChainId === chainIdNum);
      // Determine RPC URL from current app chain node

      if (!nodes || !chainNode) {
        throw new Error('Missing RPC URL for Magic initialization');
      }

      // Use the first URL if multiple are provided
      const wsRpcUrl = app.chain?.meta?.ChainNode?.url ?? '';
      const primaryUrl =
        wsRpcUrl || chainNode.url.split(',').map((url) => url.trim())?.[0];

      if (!primaryUrl) {
        throw new Error('Missing RPC URL for Magic initialization');
      }

      // Initialize Magic per-chain instance and EIP-1193 provider
      const magic: Magic | null = getMagicInstanceForChain(
        chainIdNum,
        primaryUrl,
      );
      if (!magic) {
        throw new Error('Magic is not configured');
      }

      // Ensure user is logged in or prompt via Magic UI
      try {
        const info = await magic.user.getInfo();
        console.log('info => ', info);
      } catch {
        try {
          await magic.wallet.showUI();
        } catch (uiError) {
          throw new Error('User cancelled Magic authentication');
        }
      }

      const Web3 = (await import('web3')).default;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this._web3 = { givenProvider: magic.rpcProvider } as any;

      // Request accounts via EIP-1193
      const fetchedAccounts = await this._web3.givenProvider.request({
        method: 'eth_requestAccounts',
      });
      this._accounts = fetchedAccounts.map((addr: string) =>
        Web3.utils.toChecksumAddress(addr),
      );

      // Store provider reference
      this._provider = magic.rpcProvider as unknown as ExternalProvider;

      if (this._accounts.length === 0) {
        throw new Error('Magic fetched no accounts');
      }

      await this.initAccountsChanged();
      this._enabled = true;
      this._enabling = false;
    } catch (error) {
      const message = error?.message || 'Unknown error';
      const errorMsg = `Failed to enable Magic: ${message}`;
      console.error(errorMsg);
      this._enabling = false;
      throw new Error(errorMsg);
    }
  }

  public async initAccountsChanged() {
    this._accountsChangedHandler = async (accounts: string[]) => {
      const updatedAddress = userStore
        .getState()
        .accounts.find((addr) => addr.address === accounts[0]);
      if (!updatedAddress) return;
      await setActiveAccount(updatedAddress);
    };

    this._chainChangedHandler = async (_chainId: string) => {
      try {
        const Web3 = (await import('web3')).default;
        const nextAccounts: string[] = await this._web3.givenProvider.request({
          method: 'eth_accounts',
        });
        this._accounts = nextAccounts.map((addr: string) =>
          Web3.utils.toChecksumAddress(addr),
        );
        if (this._accounts[0]) {
          const updatedAddress = userStore
            .getState()
            .accounts.find((addr) => addr.address === this._accounts[0]);
          if (updatedAddress) {
            await setActiveAccount(updatedAddress);
          }
        }
      } catch (e) {
        // noop
      }
    };

    this._disconnectHandler = async () => {
      await this.reset?.();
    };

    await this._web3.givenProvider.on(
      'accountsChanged',
      this._accountsChangedHandler,
    );
    await this._web3.givenProvider.on(
      'chainChanged',
      this._chainChangedHandler,
    );
    await this._web3.givenProvider.on('disconnect', this._disconnectHandler);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async switchNetwork(chainId?: string) {
    try {
      const targetChainIdStr = chainId ?? this.getChainId();
      const targetChainId = parseInt(targetChainIdStr, 10);

      const nodes = await fetchNodes();
      const chainNode = nodes.find((n) => n.ethChainId === targetChainId);
      // Determine RPC URL from current app chain node

      if (!nodes || !chainNode) {
        throw new Error('Missing RPC URL for Magic initialization');
      }

      // Reinitialize Magic with the new network (Magic does not support wallet_switchEthereumChain)
      const wsRpcUrl = app.chain?.meta?.ChainNode?.url ?? '';
      const primaryUrl =
        wsRpcUrl || chainNode.url.split(',').map((url) => url.trim())?.[0];
      if (!primaryUrl) return;

      const magic: Magic | null = getMagicInstanceForChain(
        targetChainId,
        primaryUrl,
      );
      if (!magic) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this._web3 = { givenProvider: magic.rpcProvider } as any;
      this._provider = magic.rpcProvider as unknown as ExternalProvider;
    } catch (error) {
      console.error('Error switching Magic network:', error);
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async reset() {
    try {
      if (this._web3?.givenProvider?.removeListener) {
        if (this._accountsChangedHandler) {
          this._web3.givenProvider.removeListener(
            'accountsChanged',
            this._accountsChangedHandler,
          );
        }
        if (this._chainChangedHandler) {
          this._web3.givenProvider.removeListener(
            'chainChanged',
            this._chainChangedHandler,
          );
        }
        if (this._disconnectHandler) {
          this._web3.givenProvider.removeListener(
            'disconnect',
            this._disconnectHandler,
          );
        }
      }
    } catch {
      // ignore
    }

    this._enabled = false;
    this._enabling = false;
    this._accounts = [];
    this._provider = undefined as unknown as ExternalProvider;
    this._web3 = undefined as unknown as Web3;
    this._accountsChangedHandler = undefined;
    this._chainChangedHandler = undefined;
    this._disconnectHandler = undefined;
  }
}

export default MagicWebWalletController;
