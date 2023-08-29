import { AbiItem } from 'web3-utils';
import ContractBase from './ContractBase';
import { BackParams, WithdrawBackParams } from './types';

const abi = [];
const wethAbi = [];

class CrowdfundContract extends ContractBase {
  private weth;

  constructor(contractAddress: string) {
    super(contractAddress, abi);
    this.weth = new this.web3.eth.Contract(
      wethAbi as AbiItem[],
      '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6'
    );
  }

  async back(prop: BackParams): Promise<void> {
    const convertedAmount = this.toBN(prop.amount).mul(this.toBN(1e18));
    await this.weth.mehthods
      .approve(this.contractAddress, convertedAmount)
      .send({ from: this.wallet.accounts[0] });
    await this.contract.methods
      .back(convertedAmount, '')
      .send({ from: this.wallet.accounts[0] });
  }

  async withdrawBack(prop: WithdrawBackParams): Promise<void> {
    await this.contract.methods
      .backersWithdraw(prop.donate)
      .send({ from: this.wallet.accounts[0] });
  }

  async withdrawProceeds(): Promise<void> {
    await this.contract.methods
      .beneficiaryWithdraw('')
      .send({ from: this.wallet.accounts[0] });
  }

  async getFundStatus(): Promise<any> {
    const status = await this.contract.methods.getStatus.call();

    return {
      deadline: status[0],
      threshold: status[1],
      totalFunding: status[2],
    };
  }
}

export default CrowdfundContract;
