import IdStore from './IdStore';
import { Contract } from '../models';

// Models a store of all the contracts
class ContractsStore extends IdStore<Contract> {

    public getContractByType(type: string): Array<Contract> {
        // filter through the _storeId map for all contracts with a specified type
        return this.getAll().filter((c) => c.type === type);
    }

    public getContractByAddress(address: string): Contract {
        // filter through the _storeId map for a contract with a specified address
        const contracts = this.getAll().filter((c) => c.address === address);
        if (contracts.length > 0) {
            return contracts[0];
        } else {
            console.log("No contract found with address: ", address);
            return null;
        }
    }

}

export default ContractsStore;
