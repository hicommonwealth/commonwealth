import { ethers } from 'ethers';
import { Keyring } from '@polkadot/api';
import { mnemonicGenerate } from '@polkadot/util-crypto';
import { ChainBase } from '../../../../../common-common/src/types';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import * as solw3 from '@solana/web3.js';


abstract class ISessionController<ChainIdType extends string | number | symbol> {
  abstract getAddress(chainId: ChainIdType): string | null;
  abstract getOrCreateAddress(chainId: ChainIdType): Promise<string>;
}


class EthereumSessionController extends ISessionController<number> {
  addresses: Record<number,string>;

  constructor() {
    super();
    this.addresses = {};
  }

  getAddress(chainId: number): string | null {
    return this.addresses[chainId];
  }

  getOrCreateAddress(chainId: number): Promise<string> {
    if (!this.addresses[chainId]) {
      this.addresses[chainId] = ethers.Wallet.createRandom().address;
    }
    return Promise.resolve(this.addresses[chainId]);
  }
}


class SubstrateSessionController extends ISessionController<string> {
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

class CosmosSDKSessionController extends ISessionController<string> {
  addresses: Record<string,string>;

  constructor() {
    super();
    this.addresses = {};
  }

  async generateWallet() {
    return DirectSecp256k1HdWallet.generate();
  }

  getAddress(chainId: string): string {
    return this.addresses[chainId];
  }

  async getOrCreateAddress(chainId: string): Promise<string> {
    if(!this.addresses[chainId]) {
      // create address
      const wallet = await this.generateWallet();
      const accounts = await wallet.getAccounts();

      this.addresses[chainId] = accounts[0].address
    }
    return Promise.resolve(this.addresses[chainId]);
  }
}


class SolanaSessionController extends ISessionController<string> {
  addresses: Record<string,string>;

  constructor() {
    super();
    this.addresses = {};
  }

  getAddress(chainId: string): string {
    return this.addresses[chainId];
  }

  getOrCreateAddress(chainId: string): Promise<string> {
    if(!this.addresses[chainId]) {
      // create address
      this.addresses[chainId] = solw3.Keypair.generate().publicKey.toString();
    }
    return Promise.resolve(this.addresses[chainId]);
  }
}


class SessionsController {
  ethereum: EthereumSessionController;
  substrate: SubstrateSessionController;
  cosmos: CosmosSDKSessionController;
  solana: SolanaSessionController;

  constructor() {
    this.ethereum = new EthereumSessionController();
    this.substrate = new SubstrateSessionController();
    this.cosmos = new CosmosSDKSessionController();
    this.solana = new SolanaSessionController();
  }

  getSessionController(chainBase: ChainBase): ISessionController<any> {
    if (chainBase == "ethereum") {
      return this.ethereum;
    } else if (chainBase == "substrate") {
      return this.substrate;
    } else if (chainBase == "cosmos") {
      return this.cosmos;
    } else if (chainBase == "solana") {
      return this.solana;
    }
  }

  getAddress(chainBase: ChainBase, chainId: string | number | symbol): string {
    return this.getSessionController(chainBase).getAddress(chainId);
  }

  getOrCreateAddress(chainBase: ChainBase, chainId: string | number | symbol): Promise<string> {
    return this.getSessionController(chainBase).getOrCreateAddress(chainId);
  }
}


export default SessionsController;
