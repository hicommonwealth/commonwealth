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

    public getContractByCommunity(community: string): Array<Contract> {
        // filter through the _storeId map for all contracts with a specified chain
        return this.getAll().filter((c) => c.community === community);
    }

    public getContractByAddress(address: string): Contract {
        return this._storeAddress[address] || null;
    }

}

export default ContractsStore;
