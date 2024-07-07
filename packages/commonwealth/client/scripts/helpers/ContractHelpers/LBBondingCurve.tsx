import { LPBondingCurveAbi } from './Abi/LPBondingCurveAbi';
import ContractBase from './ContractBase';

class LPBondingCurve extends ContractBase {
  constructor(contractAddress: string, rpc: string) {
    super(contractAddress, LPBondingCurveAbi, rpc);
  }

  async getBondingCurveAddress(): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }
    return await this.contract.methods.bondingCurveAddress().call();
  }

  async getTokenInfo(tokenAddress: string): Promise<any> {
    if (!this.initialized) {
      await this.initialize();
    }
    return await this.contract.methods.tokens(tokenAddress).call();
  }

  async buyToken(
    tokenAddress: string,
    value: string,
    walletAddress: string,
  ): Promise<boolean> {
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(true);
    }

    try {
      const result = await this.contract.methods.buyToken(tokenAddress).send({
        from: walletAddress,
        value: value,
        maxPriorityFeePerGas: null,
        maxFeePerGas: null,
      });
      return result;
    } catch (error) {
      throw new Error('Transaction failed: ' + error);
    }
  }

  async getTokenSupply(tokenAddress: string): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }
    return await this.contract.methods._getTokenSupply(tokenAddress).call();
  }

  async getPrice(
    tokenAddress: string,
    amountIn: string,
    isBuy: boolean,
  ): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }
    return await this.contract.methods
      .getPrice(tokenAddress, amountIn, isBuy)
      .call();
  }

  async transferLiquidity(
    tokenAddress: string,
    value: string,
    walletAddress: string,
  ): Promise<void> {
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(true);
    }

    try {
      await this.contract.methods.transferLiquidity(tokenAddress).send({
        from: walletAddress,
        value: value,
        maxPriorityFeePerGas: null,
        maxFeePerGas: null,
      });
    } catch (error) {
      throw new Error('Transaction failed: ' + error);
    }
  }

  async getLiquidity(tokenAddress: string): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }
    return await this.contract.methods.liquidity(tokenAddress).call();
  }

  async getAmountIn(tokenAddress: string, amountOut: string): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }
    return await this.contract.methods
      .getAmountIn(tokenAddress, amountOut)
      .call();
  }

  async getProtocolFeePercent(): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }
    return await this.contract.methods.protocolFeePercent().call();
  }
}

export default LPBondingCurve;
