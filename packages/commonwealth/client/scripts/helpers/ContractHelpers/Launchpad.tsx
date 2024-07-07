import { LaunchpadAbi } from './Abi/LaunchpadAbi';
import ContractBase from './ContractBase';

class Launchpad extends ContractBase {
  constructor(contractAddress: string, rpc: string) {
    super(contractAddress, LaunchpadAbi, rpc);
  }

  async launchTokenWithLiquidity(
    name: string,
    symbol: string,
    shares: number[],
    holders: string[],
    totalSupply: number,
    curveId: number,
    scalar: number,
    LPhook: string,
    launchAction: string,
    walletAddress: string,
    value: string,
  ): Promise<any> {
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(true);
    }

    let txReceipt;
    try {
      txReceipt = await this.contract.methods
        .launchTokenWithLiquidity(
          name,
          symbol,
          shares,
          holders,
          totalSupply,
          curveId,
          scalar,
          LPhook,
          launchAction,
        )
        .send({
          from: walletAddress,
          value: value,
          maxPriorityFeePerGas: null,
          maxFeePerGas: null,
        });
    } catch (error) {
      throw new Error('Transaction failed: ' + error);
    }

    return txReceipt;
  }

  async getProtocolFee(): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }
    return await this.contract.methods.protocolFee().call();
  }

  async getProtocolVault(): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }
    return await this.contract.methods.protocolVault().call();
  }

  async getBondingCurveAddress(): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }
    return await this.contract.methods.bondingCurveAddress().call();
  }
}

export default Launchpad;
