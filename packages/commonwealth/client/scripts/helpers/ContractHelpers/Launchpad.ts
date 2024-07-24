import {
  buyToken,
  getPrice,
  sellToken,
  transferLiquidity,
} from '../../../../../../libs/shared/src/commonProtocol';
import ContractBase from './ContractBase';

const LPBondingCurveAbi = {};

class LaunchpadBondingCurve extends ContractBase {
  tokenAddress: string;

  constructor(bondingCurveAddress: string, tokenAddress: string, rpc: string) {
    super(bondingCurveAddress, LPBondingCurveAbi, rpc);
    this.tokenAddress = tokenAddress;
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
