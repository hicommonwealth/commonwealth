import IdStore from './IdStore';
import { Contract } from '../models';

// Models a store of all the contracts
class ContractsStore extends IdStore<Contract> {
    private _storeAddress: { [address: string]: Contract } = {};
    private _storeType: { [type: string]: Array<Contract> } = {};

    public add(contract: Contract) {
        super.add(contract);
        this._storeAddress[contract.address] = contract;
        if (!this._storeType[contract.type]) {
            this._storeType[contract.type] = [];
        }
        this._storeType[contract.type].push(contract);
        return this;
    }

    public remove(contract: Contract) {
        super.remove(contract);
        delete this._storeAddress[contract.address];
        const typeIndex = this._storeType[contract.type].indexOf(contract);
        if (typeIndex === -1) {
            console.error('Attempting to remove a contract that was not found in the types store');
        }
        this._storeType[contract.type].splice(typeIndex, 1);
        return this;
    }

    public getContractByType(type: string): Array<Contract> {
        return this._storeType[type] || [];
    }

    public getContractByAddress(address: string): Contract {
        return this._storeAddress[address] || null;
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
