import { CommunityNominationsAbi } from '@commonxyz/common-protocol-abis';
import { NOMINATION_FEE } from '@hicommonwealth/evm-protocols';
import { TransactionReceipt } from 'web3';
import ContractBase from './ContractBase';

class communityNominations extends ContractBase {
  constructor(contractAddress: string, rpc: string) {
    super(contractAddress, CommunityNominationsAbi, rpc);
  }

  async initialize(
    withWallet: boolean = false,
    chainId?: string,
  ): Promise<void> {
    await super.initialize(withWallet, chainId);
  }

  async nominateJudge(
    namespace: string,
    judges: string[],
    judgeId: number,
    walletAddress: string,
  ): Promise<TransactionReceipt> {
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(true);
    }
    const maxFeePerGasEst = await this.estimateGas();
    let txReceipt;
    try {
      txReceipt = await this.contract.methods
        .nominateJudges(namespace, judges, judgeId)
        .send({
          value: this.web3.utils.toWei(NOMINATION_FEE * judges.length, 'ether'),
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

  async mintVerificationToken(
    namespace: string,
    verfiedAddress: string,
    chainId: string,
  ): Promise<TransactionReceipt> {
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(true, chainId);
    }
    const maxFeePerGasEst = await this.estimateGas();
    let txReceipt;
    try {
      txReceipt = await this.contract.methods
        .nominateNominator(namespace, verfiedAddress)
        .send({
          value: this.web3.utils.toWei(NOMINATION_FEE, 'ether'),
          from: this.wallet.accounts[0],
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

export default communityNominations;
