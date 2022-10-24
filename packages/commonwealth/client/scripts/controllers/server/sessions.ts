import { ethers } from 'ethers';
import { Keyring } from '@polkadot/api';
import { mnemonicGenerate } from '@polkadot/util-crypto';
import { ChainBase } from '../../../../../common-common/src/types';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';


abstract class WalletController<ChainIdType extends string | number | symbol> {
  abstract getAddress(chainId: ChainIdType): string | null;
  abstract getOrCreateAddress(chainId: ChainIdType): Promise<string>;
}


class EthereumWalletController extends WalletController<number> {
  addresses: Record<number,string>;

  constructor() {
    super();
    this.addresses = {};
  }

  getAddress(chainId: number): string | null {
    return this.addresses[chainId];
  }

  getOrCreateAddress(chainId: number): Promise<string> {
    return new Promise((resolve) => {
      if (!this.addresses[chainId]) {
        this.addresses[chainId] = ethers.Wallet.createRandom().address;
      }
      resolve(this.addresses[chainId]);
    });
  }
}


class SubstrateWalletController extends WalletController<string> {
  keyring: Keyring;
  addresses: Record<string,string>;

  constructor() {
    super();
    this.keyring = new Keyring();
    this.addresses = {};
  }

  generateWallet() {
    const mnemonic = mnemonicGenerate();
    const pair = this.keyring.addFromUri(mnemonic, {}, 'ed25519');

    return pair;
  }

  getAddress(chainId: string) {
    return this.addresses[chainId];
  }

  getOrCreateAddress(chainId: string): Promise<string> {
    if(!this.addresses[chainId]) {
      // create address
      const wallet = this.generateWallet();
      this.addresses[chainId] = wallet.address
    }
    return Promise.resolve(this.addresses[chainId]);
  }
}

class CosmosSDKWalletController extends WalletController<string> {
  addresses: Record<string,string>;

  constructor() {
    super();
    this.addresses = {};
  }

  async generateWallet() {
    return await DirectSecp256k1HdWallet.generate();
  }

  getAddress(chainId: string): string {
    return this.addresses[chainId];
  }

  async getOrCreateAddress(chainId: string): Promise<string> {
    return new Promise(async () => {
      if(!this.addresses[chainId]) {
        // create address
        const wallet = await this.generateWallet();
        const accounts = await wallet.getAccounts();

        this.addresses[chainId] = accounts[0].address
      }
      return this.addresses[chainId];
    });
  }
}

class SessionsController {
  ethereum: EthereumWalletController;
  substrate: SubstrateWalletController;
  cosmos: CosmosSDKWalletController;

  constructor() {
    this.ethereum = new EthereumWalletController();
    this.substrate = new SubstrateWalletController();
    this.cosmos = new CosmosSDKWalletController();
  }

  getWalletController(chainBase: ChainBase): WalletController<any> {
    if (chainBase == "ethereum") {
      return this.ethereum;
    } else if (chainBase == "substrate") {
      return this.substrate;
    } else if (chainBase == "cosmos") {
      return this.cosmos;
    }
  }
}


// this doesn't seem right, should we be using the global state
// app.chain ?

export default SessionsController;
