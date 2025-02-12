import { communityNominationsAbi } from '@hicommonwealth/evm-protocols';
import { TransactionReceipt } from 'web3';
import ContractBase from './ContractBase';

class communityNominations extends ContractBase {
  constructor(contractAddress: string, rpc: string) {
    super(contractAddress, communityNominationsAbi, rpc);
  }

  async initialize(
    withWallet: boolean = false,
    chainId?: string,
  ): Promise<void> {
    await super.initialize(withWallet, chainId);
  }

  async nominateJudge(
    namespace: string,
    judge: string,
    walletAddress: string,
  ): Promise<TransactionReceipt> {
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(true);
    }
    const maxFeePerGasEst = await this.estimateGas();
    let txReceipt;
    try {
      txReceipt = await this.contract.methods
        .nominateJudge(namespace, judge, 100)
        .send({
          from: walletAddress,
          type: '0x2',
          maxFeePerGas: maxFeePerGasEst?.toString(),
          maxPriorityFeePerGas: this.web3.utils.toWei('0.001', 'gwei'),
        });
    } catch (error) {
      console.log(error);
      throw new Error('Transaction failed');
    }
    return txReceipt;
  }
}
