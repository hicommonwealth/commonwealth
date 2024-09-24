import {
  buyToken,
  getPrice,
  launchToken,
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

  async launchToken(name: string, symbol: string, walletAddress: string) {
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(true);
    }

    const txReceipt = await launchToken(
      this.contract,
      name,
      symbol,
      [], // TODO 9207: where do shares come from?
      [], // TODO 9207: where do holders come from?
      0, // TODO 9207: where does totalSupply come from?
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
