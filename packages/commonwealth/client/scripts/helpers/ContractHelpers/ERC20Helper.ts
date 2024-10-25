import Web3 from 'web3';
import { Erc20Abi } from './Abi/ERC20Abi';
import ContractBase from './ContractBase';
class ERC20Helper extends ContractBase {
  constructor(contractAddress: string, rpc: string) {
    super(contractAddress, Erc20Abi, rpc);
  }
  async getBalance(userAddress: string): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }
    const balance = await this.contract.methods.balanceOf(userAddress).call();

    return Web3.utils.fromWei(balance, 'ether');
  }
}

export default ERC20Helper;
