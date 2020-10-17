import BN from 'bn.js';
import { Coin } from '../../currency';

export class EthereumCoin extends Coin {
  constructor(denom: string, n: number | BN | EthereumCoin, inDollars: boolean = false) {
    super(denom, n, inDollars);
  }

  public toString() {
    return this.format();
  }
}

export class ERC20Token extends EthereumCoin {
  public readonly contractAddress: string;

  constructor(contractAddress: string, n: number | BN | MolochShares) {
    super(`ERC20(${contractAddress.substr(0, 6)})`, n, false);
    this.contractAddress = contractAddress;
  }

  public toString() {
    return this.format();
  }
}

export class MolochShares extends EthereumCoin {
  public readonly contractAddress: string;

  constructor(contractAddress: string, n: number | BN | MolochShares) {
    super('Shares', n, false);
    this.contractAddress = contractAddress;
  }

  public toString() {
    return this.format();
  }
}

export class MarlinComp extends EthereumCoin {
  public readonly contractAddress: string;

  constructor(contractAddress: string, n: number | BN | MolochShares | MarlinComp) {
    super('Comp', n, false);
    this.contractAddress = contractAddress;
  }

  public toString() {
    return this.format();
  }
}
