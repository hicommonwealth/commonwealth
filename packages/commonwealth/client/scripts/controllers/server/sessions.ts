// eslint-disable-next-line max-classes-per-file
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { Keyring } from '@polkadot/api';
import { mnemonicGenerate } from '@polkadot/util-crypto';
import * as solw3 from '@solana/web3.js';
import { ethers } from 'ethers';
import { KeyPair } from 'near-api-js';
import { PublicKey } from 'near-api-js/lib/utils';
import { ChainBase } from '../../../../../common-common/src/types';

abstract class ISessionController<
  ChainIdType extends string | number | symbol
> {
  addresses: Record<ChainIdType, string>;

  constructor() {
    this.addresses = {} as Record<ChainIdType, string>;
  }

  abstract generateAddress(): Promise<string>;

  getAddress(chainId: ChainIdType): string {
    return this.addresses[chainId];
  }

  async getOrCreateAddress(chainId: ChainIdType): Promise<string> {
    if (!this.addresses[chainId]) {
      // create address
      this.addresses[chainId] = await this.generateAddress();
    }
    return this.addresses[chainId];
  }
}

class EthereumSessionController extends ISessionController<number> {
  async generateAddress() {
    return ethers.Wallet.createRandom().address;
  }
}

class SubstrateSessionController extends ISessionController<string> {
  keyring: Keyring;

  constructor() {
    super();
    this.keyring = new Keyring();
  }

  async generateAddress() {
    const mnemonic = mnemonicGenerate();
    const pair = this.keyring.addFromUri(mnemonic, {}, 'ed25519');

    return pair.address;
  }
}

class CosmosSDKSessionController extends ISessionController<string> {
  async generateAddress(): Promise<string> {
    const wallet = await DirectSecp256k1HdWallet.generate();
    const accounts = await wallet.getAccounts();

    return accounts[0].address;
  }
}

class SolanaSessionController extends ISessionController<string> {
  async generateAddress(): Promise<string> {
    return solw3.Keypair.generate().publicKey.toString();
  }
}

class NEARSessionController extends ISessionController<string> {
  async generateAddress(): Promise<string> {
    const ed25519Key = KeyPair.fromRandom('ed25519').getPublicKey().toString();
    return Buffer.from(PublicKey.fromString(ed25519Key).data).toString('hex');
  }
}

class SessionsController {
  ethereum: EthereumSessionController;
  substrate: SubstrateSessionController;
  cosmos: CosmosSDKSessionController;
  solana: SolanaSessionController;
  near: NEARSessionController;

  constructor() {
    this.ethereum = new EthereumSessionController();
    this.substrate = new SubstrateSessionController();
    this.cosmos = new CosmosSDKSessionController();
    this.solana = new SolanaSessionController();
    this.near = new NEARSessionController();
  }

  getSessionController(chainBase: ChainBase): ISessionController<any> {
    if (chainBase == 'ethereum') {
      return this.ethereum;
    } else if (chainBase == 'substrate') {
      return this.substrate;
    } else if (chainBase == 'cosmos') {
      return this.cosmos;
    } else if (chainBase == 'solana') {
      return this.solana;
    } else if (chainBase == 'near') {
      return this.near;
    }
  }

  getAddress(chainBase: ChainBase, chainId: string | number | symbol): string {
    return this.getSessionController(chainBase).getAddress(chainId);
  }

  async getOrCreateAddress(
    chainBase: ChainBase,
    chainId: string | number | symbol
  ): Promise<string> {
    return this.getSessionController(chainBase).getOrCreateAddress(chainId);
  }
}

export default SessionsController;
