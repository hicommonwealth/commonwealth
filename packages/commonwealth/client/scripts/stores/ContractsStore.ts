import IdStore from './IdStore';
import { Contract } from '../models';

// Models a store of all the contracts
class ContractsStore extends IdStore<Contract> {

    public getContractByType(type: string): Array<Contract> {
        // filter through the _storeId map for all contracts with a specified type
        return this.getAll().filter((c) => c.type === type);
    }

}

export default ContractsStore;
