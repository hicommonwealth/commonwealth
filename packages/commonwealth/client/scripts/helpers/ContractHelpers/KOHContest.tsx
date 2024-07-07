import { KOHContestAbi } from './Abi/KOHContestAbi';
import ContractBase from './ContractBase';

class KOHContest extends ContractBase {
  constructor(contractAddress: string, rpc: string) {
    super(contractAddress, KOHContestAbi, rpc);
  }

  async recordBuy(
    token: string,
    buyAmount: string,
    walletAddress: string,
  ): Promise<any> {
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(true);
    }

    let txReceipt;
    try {
      txReceipt = await this.contract.methods.recordBuy(token, buyAmount).send({
        from: walletAddress,
        maxPriorityFeePerGas: null,
        maxFeePerGas: null,
      });
    } catch (error) {
      throw new Error('Transaction failed: ' + error);
    }

    return txReceipt;
  }

  async recordSell(
    token: string,
    sellAmount: string,
    walletAddress: string,
  ): Promise<any> {
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(true);
    }

    let txReceipt;
    try {
      txReceipt = await this.contract.methods
        .recordSell(token, sellAmount)
        .send({
          from: walletAddress,
          maxPriorityFeePerGas: null,
          maxFeePerGas: null,
        });
    } catch (error) {
      throw new Error('Transaction failed: ' + error);
    }

    return txReceipt;
  }

  // Getter methods for the additional fields
  async getOwner(): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }
    return await this.contract.methods.owner().call();
  }

  async getCurveActionHook(): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }
    return await this.contract.methods.curveActionHook().call();
  }

  async getBondingCurve(): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }
    return await this.contract.methods.bondingCurve().call();
  }

  async getInterval(): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }
    return await this.contract.methods.interval().call();
  }

  async getLastStart(): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }
    return await this.contract.methods.lastStart().call();
  }

  async getContestId(): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }
    return await this.contract.methods.contestId().call();
  }

  async getCurrWinningToken(): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }
    return await this.contract.methods.currWinningToken().call();
  }

  async getCurrWinningVolume(): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }
    return await this.contract.methods.currWinningVolume().call();
  }

  async getCurrMinVolume(): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }
    return await this.contract.methods.currMinVolume().call();
  }

  async getTopThreeValues(): Promise<string[]> {
    if (!this.initialized) {
      await this.initialize();
    }
    return await this.contract.methods.topThreeValues().call();
  }

  async getTopThreeOwners(): Promise<string[]> {
    if (!this.initialized) {
      await this.initialize();
    }
    return await this.contract.methods.topThreeOwners().call();
  }
}

export default KOHContest;
