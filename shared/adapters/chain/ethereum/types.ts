import BN from 'bn.js';
import { Coin } from '../../currency';

export class EthereumCoin extends Coin {
  constructor(denom: string, n: number | BN | EthereumCoin, inDollars = false) {
    super(denom, n, inDollars, (new BN(10)).pow(new BN(18)));
  }
}

export class MolochShares extends EthereumCoin {
  public readonly contractAddress: string;

  constructor(contractAddress: string, n: number | BN | MolochShares) {
    super('Shares', n, false);
    this.contractAddress = contractAddress;
  }
}

export class ERC20Token extends EthereumCoin {
  public readonly contractAddress: string;

  constructor(contractAddress: string, n: number | BN) {
    super(`ERC20(${contractAddress.substr(0, 6)})`, n, false);
    this.contractAddress = contractAddress;
  }
}

export class ERC721Token extends EthereumCoin {
  public readonly contractAddress: string;

  constructor(contractAddress: string, n: number | BN) {
    super(`ERC721(${contractAddress.substr(0, 6)})`, n, false);
    this.contractAddress = contractAddress;
  }
}

export class MPond extends EthereumCoin {
  public readonly contractAddress: string;

  constructor(contractAddress: string, n: number | BN | MPond) {
    super('MPond', n, false);
    this.contractAddress = contractAddress;
  }
}
