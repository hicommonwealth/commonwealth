import { Erc20Abi } from './Abi/ERC20Abi';
import ContractBase from './ContractBase';
class ERC20Helper extends ContractBase {
  constructor(contractAddress: string, rpc: string) {
    super(contractAddress, Erc20Abi, rpc);
  }
  async getBalance(userAddress: string): Promise<number> {
    if (!this.initialized) {
      await this.initialize();
    }
    const balance = this.contract.methods.balanceOf(userAddress);
    return Number(balance);
  }
}

export default ERC20Helper;
