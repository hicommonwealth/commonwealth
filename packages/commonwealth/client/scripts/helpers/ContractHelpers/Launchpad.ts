import { Contract } from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';
import {
  buyToken,
  getPrice,
  launchToken,
  sellToken,
  transferLiquidity,
} from '../../../../../../libs/shared/src/commonProtocol';
import { LpBondingCurve } from './Abi/LpBondingCurveAbi';
import ContractBase from './ContractBase';
import { LaunchpadFactory } from './LaunchpadFactoryAbi';

class LaunchpadBondingCurve extends ContractBase {
  tokenAddress: string;
  launchpadFactory: Contract<typeof LaunchpadFactory>;

  constructor(
    bondingCurveAddress: string,
    launchpadFactoryAddress: string,
    tokenAddress: string,
    rpc: string,
  ) {
    super(bondingCurveAddress, LpBondingCurve, rpc);
    this.tokenAddress = tokenAddress;
    this.launchpadFactory = new this.web3.eth.Contract(
      LaunchpadFactory as AbiItem[],
      launchpadFactoryAddress,
    ) as unknown as Contract<typeof LaunchpadFactory>;
  }

  async launchToken(name: string, symbol: string, walletAddress: string) {
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(true);
    }

    const txReceipt = await launchToken(
      this.launchpadFactory,
      name,
      symbol,
      [7000, 1250, 1500, 750], // 9181 parameters
      // should include at community treasury at [0] and contest creation util at [1] curr tbd
      [walletAddress, walletAddress],
      1_000_000_000e18, // Default 1B tokens
      walletAddress,
    );
    return txReceipt;
  }

  async buyToken(amountEth: number, walletAddress: string) {
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(true);
    }

    const txReceipt = await buyToken(
      this.contract,
      this.tokenAddress,
      walletAddress,
      amountEth,
    );
    return txReceipt;
  }

  async sellToken(amountSell: number, walletAddress: string) {
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(true);
    }

    const txReceipt = await sellToken(
      this.contract,
      this.tokenAddress,
      amountSell,
      walletAddress,
    );
    return txReceipt;
  }

  async transferLiquidity(walletAddress: string) {
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(true);
    }

    const txReceipt = await transferLiquidity(
      this.contract,
      this.tokenAddress,
      walletAddress,
    );
    return txReceipt;
  }

  async getAmountOut(amountIn: number, buy: boolean) {
    const amountOut = await getPrice(
      this.contractAddress,
      this.tokenAddress,
      amountIn,
      buy,
    );
    return Number(amountOut / 1e18);
  }
}

export default LaunchpadBondingCurve;
