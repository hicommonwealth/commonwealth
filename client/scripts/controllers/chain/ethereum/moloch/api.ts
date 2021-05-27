import { Moloch1 } from 'eth/types';
import ContractApi from 'controllers/chain/ethereum/contractApi';

export default class MolochAPI extends ContractApi<Moloch1> {
  public async init(): Promise<void> {
    const tokenAddress = await this.Contract.approvedToken();
    await super.init(tokenAddress);
  }
}
