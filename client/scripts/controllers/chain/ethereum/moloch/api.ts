import { Moloch1 } from 'Moloch1';
import ContractApi from 'controllers/chain/ethereum/contractApi';

export default class MolochAPI extends ContractApi<Moloch1> {
  public async init(): Promise<void> {
    const tokenAddress = await this.Contract.approvedToken();
    await super.init(tokenAddress);
  }
}
