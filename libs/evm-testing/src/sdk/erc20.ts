import Web3, { AbiFragment, Contract } from 'web3';
import { erc20 } from '../utils/contracts';
import { SdkBase } from './sdkBase';

export class ERC20 extends SdkBase {
  public address: string;
  public contract: Contract<AbiFragment[]>;

  constructor(address: string) {
    super();
    this.address = address;
    this.contract = erc20(this.address, this.web3);
  }

  // ERC20
  /**
   * Get the balance of a given wallet for any ERC20
   * @param tokenAddress Address of ERC20 Token
   * @param address address to check balance
   * @param convert convert from wei to ether?
   * @returns token balance
   */
  public async getBalance(address: string, convert?: boolean) {
    let balance: string = await this.contract.methods.balanceOf(address).call();
    if (convert) {
      balance = Web3.utils.fromWei(balance, 'ether');
    }
    return balance.toString();
  }

  /**
   * Transfer an ERC20 token between addresses
   * @param tokenAddress ERC20 token address
   * @param to address to transfer to
   * @param amount amount in ether to transfer
   * @param from account to transfer from(erc20.transferFrom)
   * @param accountIndex account index to create transfer tx from(erc20.transfer)
   */
  public async transfer(to: string, amount: string, from?: string) {
    let txReceipt;
    if (from) {
      txReceipt = await this.contract.methods
        .transfer(to, Web3.utils.toWei(amount, 'ether'))
        .send({
          from,
          gas: '400000',
        });
    } else {
      txReceipt = await this.contract.methods
        .transfer(to, Web3.utils.toWei(amount, 'ether'))
        .send({
          from: '0xF977814e90dA44bFA03b6295A0616a897441aceC',
          gas: '400000',
        });
    }
    return { block: Number(txReceipt.blockNumber) };
  }

  /**
   * Approve a spender to spend an ERC20 token
   * @param tokenAddress ERC20 token address
   * @param spender address to approve
   * @param amount amount to approve
   * @param accountIndex account index to create approve tx from(erc20.approve)
   */
  public async approve(
    spender: string,
    amount: string,
    accountIndex?: number,
  ): Promise<{ block: number }> {
    const account = (await this.getAccounts())[accountIndex ?? 0];
    const txReceipt = await this.contract.methods
      .approve(spender, amount)
      .send({ from: account });
    return { block: Number(txReceipt['blockNumber']) };
  }
}
